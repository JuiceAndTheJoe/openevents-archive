import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { lockTicketTypes } from '@/lib/orders'

const DEFAULT_CLEANUP_LIMIT = 200
const MAX_CLEANUP_LIMIT = 1000

function normalizeCleanupLimit(limit?: number): number {
  if (!Number.isFinite(limit) || !limit || limit <= 0) {
    return DEFAULT_CLEANUP_LIMIT
  }

  return Math.min(Math.floor(limit), MAX_CLEANUP_LIMIT)
}

export interface ExpiredReservationCleanupResult {
  expiredOrders: number
  releasedTickets: number
  releasedDiscountUsages: number
  scannedOrders: number
  limit: number
  runAt: string
}

export async function cleanupExpiredPendingOrders(limit?: number): Promise<ExpiredReservationCleanupResult> {
  const normalizedLimit = normalizeCleanupLimit(limit)
  const now = new Date()

  const result = await prisma.$transaction(
    async (tx) => {
      const staleOrders = await tx.order.findMany({
        where: {
          status: 'PENDING',
          paidAt: null,
          cancelledAt: null,
          expiresAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          discountCodeId: true,
          items: {
            select: {
              ticketTypeId: true,
              quantity: true,
            },
          },
        },
        orderBy: {
          expiresAt: 'asc',
        },
        take: normalizedLimit,
      })

      if (staleOrders.length === 0) {
        return {
          scannedOrders: 0,
          expiredOrders: 0,
          releasedTickets: 0,
          releasedDiscountUsages: 0,
        }
      }

      const ticketTypeIds = Array.from(
        new Set(staleOrders.flatMap((order) => order.items.map((item) => item.ticketTypeId)))
      )

      await lockTicketTypes(tx, ticketTypeIds)

      let expiredOrders = 0
      let releasedTickets = 0
      let releasedDiscountUsages = 0

      for (const order of staleOrders) {
        const markExpired = await tx.order.updateMany({
          where: {
            id: order.id,
            status: 'PENDING',
            paidAt: null,
            cancelledAt: null,
            expiresAt: {
              lte: now,
            },
          },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            expiresAt: null,
          },
        })

        if (markExpired.count === 0) {
          continue
        }

        expiredOrders += 1

        for (const item of order.items) {
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: {
              reservedCount: {
                decrement: item.quantity,
              },
            },
          })

          releasedTickets += item.quantity
        }

        if (order.discountCodeId) {
          const releaseDiscount = await tx.discountCode.updateMany({
            where: {
              id: order.discountCodeId,
              usedCount: {
                gt: 0,
              },
            },
            data: {
              usedCount: {
                decrement: 1,
              },
            },
          })

          releasedDiscountUsages += releaseDiscount.count
        }
      }

      return {
        scannedOrders: staleOrders.length,
        expiredOrders,
        releasedTickets,
        releasedDiscountUsages,
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )

  return {
    ...result,
    limit: normalizedLimit,
    runAt: now.toISOString(),
  }
}
