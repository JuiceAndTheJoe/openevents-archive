import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'
import { OrderStatus, Prisma } from '@prisma/client'

const revenueStatuses: OrderStatus[] = ['PAID']

export type DashboardAnalytics = {
  topEvents: Array<{
    eventId: string
    title: string
    revenue: number
    ticketsSold: number
    startDate: Date
    categories: string[]
  }>
  dailySales: Array<{ date: string; revenue: number; ticketsSold: number }>
}

async function fetchDashboardAnalytics(organizerId: string | null): Promise<DashboardAnalytics> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  // Build where clause - null organizerId means platform-wide (super admin)
  const eventWhere: Prisma.EventWhereInput = organizerId
    ? { organizerId, deletedAt: null }
    : { deletedAt: null }

  const [topRevenue, trendOrders] = await prisma.$transaction([
    prisma.order.groupBy({
      by: ['eventId'],
      where: {
        event: eventWhere,
        status: { in: revenueStatuses },
      },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        event: eventWhere,
        status: { in: revenueStatuses },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        totalAmount: true,
        createdAt: true,
        items: { select: { quantity: true } },
      },
    }),
  ])

  const topEventIds = topRevenue.map((e) => e.eventId)

  const [events, ticketRows] = topEventIds.length
    ? await Promise.all([
        prisma.event.findMany({
          where: { id: { in: topEventIds } },
          select: {
            id: true,
            title: true,
            startDate: true,
            categories: { select: { category: { select: { name: true } } } },
          },
        }),
        prisma.orderItem.findMany({
          where: {
            order: { eventId: { in: topEventIds }, status: { in: revenueStatuses } },
          },
          select: { quantity: true, ticketType: { select: { eventId: true } } },
        }),
      ])
    : [[], []]

  const eventMap = new Map(events.map((e) => [e.id, e]))
  const ticketsByEvent = new Map<string, number>()
  for (const row of ticketRows) {
    const eid = row.ticketType.eventId
    ticketsByEvent.set(eid, (ticketsByEvent.get(eid) ?? 0) + row.quantity)
  }

  const topEvents = topRevenue.map((item) => {
    const event = eventMap.get(item.eventId)
    return {
      eventId: item.eventId,
      title: event?.title ?? 'Unknown',
      revenue: Number(item._sum?.totalAmount?.toString() ?? '0'),
      ticketsSold: ticketsByEvent.get(item.eventId) ?? 0,
      startDate: event?.startDate ?? new Date(),
      categories: event?.categories.map((c) => c.category.name) ?? [],
    }
  })

  // Build 30-day trend maps (all days initialised to 0)
  const revenueMap = new Map<string, number>()
  const ticketsMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    revenueMap.set(key, 0)
    ticketsMap.set(key, 0)
  }
  for (const o of trendOrders) {
    const day = o.createdAt.toISOString().slice(0, 10)
    if (revenueMap.has(day)) {
      revenueMap.set(day, (revenueMap.get(day) ?? 0) + Number(o.totalAmount.toString()))
      const qty = o.items.reduce((s, item) => s + item.quantity, 0)
      ticketsMap.set(day, (ticketsMap.get(day) ?? 0) + qty)
    }
  }
  const dailySales = Array.from(revenueMap.keys()).map((date) => ({
    date,
    revenue: revenueMap.get(date) ?? 0,
    ticketsSold: ticketsMap.get(date) ?? 0,
  }))

  return { topEvents, dailySales }
}

// Cached for 5 minutes. Each unique organizerId gets its own cache entry.
export const getDashboardAnalytics = unstable_cache(
  fetchDashboardAnalytics,
  ['dashboard-analytics'],
  { revalidate: 300, tags: ['dashboard-analytics'] },
)
