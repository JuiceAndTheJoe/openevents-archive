'use client'

import Link from 'next/link'
import { EventStatus } from '@prisma/client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EventStatusBadge } from '@/components/dashboard/EventStatusBadge'
import { formatDateTime } from '@/lib/utils'

type EventsTableProps = {
  events: Array<{
    id: string
    slug: string
    title: string
    startDate: Date
    endDate: Date
    status: EventStatus
    visibility: 'PUBLIC' | 'PRIVATE'
    _count: {
      orders: number
      ticketTypes: number
    }
  }>
}

export function EventsTable({ events }: EventsTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runAction(eventId: string, action: 'publish' | 'cancel') {
    setBusyId(eventId)
    setError(null)

    try {
      const endpoint = action === 'publish' ? `/api/events/${eventId}/publish` : `/api/events/${eventId}/cancel`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'cancel' ? JSON.stringify({}) : undefined,
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json?.error || `Failed to ${action} event`)
      }
      window.location.reload()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  async function deleteEvent(eventId: string, eventTitle: string) {
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${eventTitle}"? This action cannot be undone.`)
    if (!confirmed) return

    setBusyId(eventId)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json?.error || 'Failed to delete event')
      }
      window.location.reload()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
        No events match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {error ? <p className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Event</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Orders</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tickets</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.visibility}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{formatDateTime(event.startDate)}</td>
                <td className="px-4 py-3"><EventStatusBadge status={event.status} /></td>
                <td className="px-4 py-3 text-gray-700">{event._count.orders}</td>
                <td className="px-4 py-3 text-gray-700">{event._count.ticketTypes}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/events/${event.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    {event.status !== 'DRAFT' ? (
                      <Link href={`/dashboard/events/${event.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    ) : null}
                    {event.status !== 'DRAFT' && event.status !== 'CANCELLED' ? (
                      <Link href={`/dashboard/events/${event.id}/scan`}>
                        <Button size="sm">Scan</Button>
                      </Link>
                    ) : null}
                    {event.status === 'DRAFT' ? (
                      <Button size="sm" isLoading={busyId === event.id} onClick={() => runAction(event.id, 'publish')}>
                        Publish
                      </Button>
                    ) : null}
                    {event.status === 'PUBLISHED' ? (
                      <Button variant="destructive" size="sm" isLoading={busyId === event.id} onClick={() => runAction(event.id, 'cancel')}>
                        Cancel
                      </Button>
                    ) : null}
                    {event.status === 'CANCELLED' || event.status === 'DRAFT' ? (
                      <Button variant="destructive" size="sm" isLoading={busyId === event.id} onClick={() => deleteEvent(event.id, event.title)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
