import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type TopEvent = {
  eventId: string
  title: string
  revenue: number
  ticketsSold: number
  startDate: Date
  categories: string[]
}

type SalesChartProps = {
  title?: string
  data: TopEvent[]
  currency?: string
}

function formatStartDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SalesChart({ title = 'Top Selling Events', data, currency = 'SEK' }: SalesChartProps) {
  return (
    <section className="rounded-[14px] border border-[#f3f4f6] bg-white p-6 shadow-md">
      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>

      {data.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No sales data yet.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {data.map((event, i) => (
            <Link
              key={event.eventId}
              href={`/dashboard/events/${event.eventId}`}
              className="flex items-start gap-4 rounded-[10px] bg-[#f9fafb] px-4 pt-4 pb-4 transition-colors hover:bg-gray-100"
            >
              {/* Rank badge */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5c8bd9]">
                <span className="text-base font-bold leading-none text-white">{i + 1}</span>
              </div>

              {/* Event info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-gray-900">{event.title}</p>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 shrink-0 text-[#4a5565]" />
                    <span className="whitespace-nowrap text-sm text-[#4a5565]">
                      {formatStartDate(event.startDate)}
                    </span>
                  </div>
                  {event.categories.length > 0 && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#4a5565]">
                      {event.categories[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Revenue + tickets */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-[#5c8bd9]">
                  {formatCurrency(event.revenue, currency)}
                </p>
                <p className="text-sm text-[#4a5565]">{event.ticketsSold} tickets</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
