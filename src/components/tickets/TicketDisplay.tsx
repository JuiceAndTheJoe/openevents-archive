import Link from 'next/link'
import { CalendarPlus, ExternalLink, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { DownloadTicketsButton } from '@/components/tickets/DownloadTicketsButton'
import { TicketQRCode } from '@/components/tickets/TicketQRCode'

interface TicketDisplayProps {
  order: {
    orderNumber: string
    status: string
    buyerFirstName: string
    buyerLastName: string
    buyerEmail: string
    totalAmount: { toString(): string } | string
    currency: string
    event: {
      title: string
      slug: string
      startDate: Date
      endDate: Date
      locationType: string
      venue: string | null
      city: string | null
      country: string | null
      onlineUrl: string | null
    }
    tickets: Array<{
      id: string
      ticketCode: string
      status: string
      attendeeFirstName: string | null
      attendeeLastName: string | null
      attendeeEmail: string | null
      ticketTypeId: string
    }>
    items: Array<{
      id: string
      quantity: number
      ticketType: {
        name: string
      }
    }>
  }
}

function getStatusDisplay(status: string): { label: string; className: string } {
  switch (status) {
    case 'PAID':
      return { label: 'Paid', className: 'bg-green-100 text-green-800' }
    case 'PENDING_INVOICE':
      return { label: 'Awaiting Payment', className: 'bg-yellow-100 text-yellow-800' }
    case 'PENDING':
      return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' }
    case 'CANCELLED':
      return { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    case 'REFUNDED':
      return { label: 'Refunded', className: 'bg-gray-100 text-gray-800' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800' }
  }
}

export function TicketDisplay({ order }: TicketDisplayProps) {
  const eventLocation =
    order.event.locationType === 'ONLINE'
      ? order.event.onlineUrl || 'Online event'
      : [order.event.venue, order.event.city, order.event.country].filter(Boolean).join(', ')

  const isPendingInvoice = order.status === 'PENDING_INVOICE'
  const statusDisplay = getStatusDisplay(order.status)

  const calendarStart = new Date(order.event.startDate).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const calendarEnd = new Date(order.event.endDate).toISOString().replace(/[-:]|\.\d{3}/g, '')
  const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(order.event.title)}&dates=${calendarStart}/${calendarEnd}&location=${encodeURIComponent(eventLocation)}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-gray-900">Status:</span>{' '}
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusDisplay.className}`}>
              {statusDisplay.label}
            </span>
          </p>
          <p>
            <span className="font-medium text-gray-900">Buyer:</span> {order.buyerFirstName} {order.buyerLastName}<span className="print:hidden"> ({order.buyerEmail})</span>
          </p>
          <p>
            <span className="font-medium text-gray-900">Event:</span> {order.event.title}
          </p>
          <p>
            <span className="font-medium text-gray-900">Date:</span> {formatDateTime(order.event.startDate)}
          </p>
          <p>
            <span className="font-medium text-gray-900">Location:</span> {eventLocation}
          </p>
          <p>
            <span className="font-medium text-gray-900">Total:</span> {order.totalAmount.toString()}{' '}
            {order.currency}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-3 print:hidden">
            <Link
              href={`/events/${order.event.slug}`}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
              View Event
            </Link>
            <a
              href={calendarUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Add to Calendar
            </a>
            <DownloadTicketsButton />
          </div>
        </CardContent>
      </Card>

      {isPendingInvoice && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-800">
              <CreditCard className="h-5 w-5" />
              Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-yellow-800">
              Your order has been received and is awaiting payment. Please complete your payment to receive your tickets.
            </p>
            <div className="rounded-md border border-yellow-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-gray-900">Payment Details</h4>
              <dl className="space-y-1 text-gray-700">
                <div className="flex justify-between">
                  <dt>Reference:</dt>
                  <dd className="font-mono font-medium">{order.orderNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Amount:</dt>
                  <dd className="font-medium">{order.totalAmount.toString()} {order.currency}</dd>
                </div>
              </dl>
            </div>
            <p className="text-xs text-yellow-700">
              Please include your order number ({order.orderNumber}) as the payment reference.
              Your tickets will be issued once payment is confirmed by the event organizer.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {order.tickets.length === 0 ? (
            <div className="text-sm text-gray-500">
              {isPendingInvoice ? (
                <p>
                  Your tickets will be issued once your invoice payment has been received and confirmed by the event organizer.
                </p>
              ) : (
                <p>Tickets have not been issued yet.</p>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {order.tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-md border border-gray-200 p-4">
                  <div className="flex items-start gap-4">
                    <TicketQRCode ticketCode={ticket.ticketCode} size={80} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{ticket.ticketCode}</p>
                      <p className="text-xs text-gray-500">Status: {ticket.status}</p>
                      {ticket.attendeeFirstName && (
                        <p className="mt-1 text-xs text-gray-600">
                          {ticket.attendeeFirstName} {ticket.attendeeLastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
