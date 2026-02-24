import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredPendingOrders } from '@/lib/orders/cleanupExpired'

function isAuthorized(request: NextRequest): boolean {
  const expectedToken = process.env.ORDER_CLEANUP_TOKEN
  if (!expectedToken) return true

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length) === expectedToken
  }

  return request.headers.get('x-cleanup-token') === expectedToken
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined

    const result = await cleanupExpiredPendingOrders(parsedLimit)

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    console.error('Failed to cleanup expired orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
