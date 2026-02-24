const DEFAULT_ORDER_RESERVATION_TTL_MINUTES = 15

function parsePositiveInteger(value: string | undefined): number | null {
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return parsed
}

export function getOrderReservationTtlMinutes(value?: string): number {
  return parsePositiveInteger(value) ?? DEFAULT_ORDER_RESERVATION_TTL_MINUTES
}

export function getClientOrderReservationTtlMinutes(): number {
  return getOrderReservationTtlMinutes(process.env.NEXT_PUBLIC_ORDER_RESERVATION_TTL_MINUTES)
}

export function getOrderReservationExpiry(
  createdAt: Date = new Date(),
  ttlMinutes: number = getClientOrderReservationTtlMinutes()
): Date {
  return new Date(createdAt.getTime() + ttlMinutes * 60_000)
}
