'use client'

import { ChangeEvent, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type EventFormMode = 'create' | 'edit'

type EventFormData = {
  id?: string
  title: string
  description?: string | null
  descriptionHtml?: string | null
  startDate: string
  endDate: string
  timezone: string
  locationType: 'PHYSICAL' | 'ONLINE' | 'HYBRID'
  venue?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
  onlineUrl?: string | null
  coverImage?: string | null
  bottomImage?: string | null
  speakerNames?: string
  organizerNames?: string
  sponsorNames?: string
  visibility: 'PUBLIC' | 'PRIVATE'
  cancellationDeadlineHours: number
  categoryIds?: string[]
}

type EventFormProps = {
  mode: EventFormMode
  initialData?: EventFormData
}

const fallbackInitialData: EventFormData = {
  title: '',
  description: '',
  descriptionHtml: '',
  startDate: '',
  endDate: '',
  timezone: 'UTC',
  locationType: 'PHYSICAL',
  venue: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  onlineUrl: '',
  coverImage: '',
  bottomImage: '',
  speakerNames: '',
  organizerNames: '',
  sponsorNames: '',
  visibility: 'PUBLIC',
  cancellationDeadlineHours: 48,
  categoryIds: [],
}

function toDateTimeLocalString(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60000)
  return localDate.toISOString().slice(0, 16)
}

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function parseNameList(raw?: string | null): string[] {
  return (raw || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

export function EventForm({ mode, initialData }: EventFormProps) {
  const router = useRouter()
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const bottomInputRef = useRef<HTMLInputElement | null>(null)
  const mergedInitialData = useMemo(() => ({ ...fallbackInitialData, ...initialData }), [initialData])

  const [form, setForm] = useState<EventFormData>({
    ...mergedInitialData,
    startDate: toDateTimeLocalString(mergedInitialData.startDate),
    endDate: toDateTimeLocalString(mergedInitialData.endDate),
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isUploadingBottom, setIsUploadingBottom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function uploadEventImage(file: File, targetField: 'coverImage' | 'bottomImage') {
    if (!form.id && mode === 'edit') {
      throw new Error('Save the event once before uploading images')
    }

    const uploadRes = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: 'events',
        entityId: form.id || 'new',
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    })

    if (!uploadRes.ok) {
      throw new Error('Failed to create upload URL')
    }

    const uploadData = await uploadRes.json()
    const uploadUrl = uploadData?.data?.uploadUrl as string | undefined
    const publicUrl = uploadData?.data?.publicUrl as string | undefined

    if (!uploadUrl || !publicUrl) {
      throw new Error('Invalid upload response')
    }

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })

    if (!putRes.ok) {
      throw new Error('Failed to upload image')
    }

    updateField(targetField, publicUrl)
  }

  async function onImageSelected(event: ChangeEvent<HTMLInputElement>, targetField: 'coverImage' | 'bottomImage') {
    const file = event.target.files?.[0]
    if (!file) return

    if (!allowedImageMimeTypes.has(file.type)) {
      setError('Please select a JPG, PNG, WEBP, or GIF image.')
      event.target.value = ''
      return
    }

    if (targetField === 'coverImage') {
      setIsUploadingBanner(true)
    } else {
      setIsUploadingBottom(true)
    }

    try {
      await uploadEventImage(file, targetField)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
    } finally {
      if (targetField === 'coverImage') {
        setIsUploadingBanner(false)
      } else {
        setIsUploadingBottom(false)
      }
      event.target.value = ''
    }
  }

  async function submit(action: 'save' | 'publish') {
    setIsSubmitting(true)
    setError(null)

    try {
      const startDate = new Date(form.startDate)
      const endDate = new Date(form.endDate)

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error('Start and end dates are required')
      }

      const payload = {
        ...form,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        onlineUrl: form.onlineUrl || null,
        coverImage: form.coverImage || null,
        bottomImage: form.bottomImage || null,
        speakerNames: parseNameList(form.speakerNames),
        organizerNames: parseNameList(form.organizerNames),
        sponsorNames: parseNameList(form.sponsorNames),
        categoryIds: form.categoryIds,
      }

      const endpoint = mode === 'create' ? '/api/events' : `/api/events/${form.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const eventRes = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const eventJson = await eventRes.json()
      if (!eventRes.ok) {
        throw new Error(eventJson?.error || 'Failed to save event')
      }

      const eventId = eventJson?.data?.id || form.id

      if (action === 'publish' && eventId) {
        const publishRes = await fetch(`/api/events/${eventId}/publish`, {
          method: 'POST',
        })

        const publishJson = await publishRes.json()
        if (!publishRes.ok) {
          throw new Error(publishJson?.error || 'Failed to publish event')
        }
      }

      if (eventId) {
        router.push(`/dashboard/events/${eventId}/edit`)
      } else {
        router.refresh()
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 px-1 sm:px-0">
      <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
        {mode === 'create' ? 'Create Event Info' : 'Edit Event Info'}
      </h2>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="overflow-hidden rounded-xl border-4 border-blue-500 bg-gray-900">
        {form.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.coverImage} alt="Event banner" className="h-[230px] w-full object-cover sm:h-[340px]" />
        ) : (
          <div className="h-[230px] bg-gradient-to-r from-slate-700 to-slate-900 sm:h-[340px]" />
        )}
      </section>

      <div>
        <input
          ref={bannerInputRef}
          id="coverImageUpload"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => onImageSelected(event, 'coverImage')}
          className="hidden"
          disabled={isUploadingBanner}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => bannerInputRef.current?.click()}
          isLoading={isUploadingBanner}
        >
          Add banner image
        </Button>
      </div>

      <section className="space-y-5 border-b border-gray-300 pb-6">
        <h3 className="text-3xl font-semibold text-gray-900">Event Header</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="title" required>Title</Label>
            <Input id="title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="startDate" required>Start</Label>
            <Input id="startDate" type="datetime-local" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="endDate" required>End</Label>
            <Input id="endDate" type="datetime-local" value={form.endDate} onChange={(e) => updateField('endDate', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value={form.timezone} onChange={(e) => updateField('timezone', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="locationType" required>Location Type</Label>
            <select
              id="locationType"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
              value={form.locationType}
              onChange={(e) => updateField('locationType', e.target.value as EventFormData['locationType'])}
            >
              <option value="PHYSICAL">Physical</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          {form.locationType !== 'ONLINE' ? (
            <>
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" value={form.venue || ''} onChange={(e) => updateField('venue', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address || ''} onChange={(e) => updateField('address', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city || ''} onChange={(e) => updateField('city', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state || ''} onChange={(e) => updateField('state', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country || ''} onChange={(e) => updateField('country', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" value={form.postalCode || ''} onChange={(e) => updateField('postalCode', e.target.value)} />
              </div>
            </>
          ) : null}
          {(form.locationType === 'ONLINE' || form.locationType === 'HYBRID') ? (
            <div className="md:col-span-2">
              <Label htmlFor="onlineUrl">Online URL</Label>
              <Input id="onlineUrl" value={form.onlineUrl || ''} onChange={(e) => updateField('onlineUrl', e.target.value)} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-5 border-b border-gray-300 pb-6">
        <h3 className="text-3xl font-semibold text-gray-900">Overview</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description" required>Description</Label>
            <textarea
              id="description"
              className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={form.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="descriptionHtml">Rich Description (HTML)</Label>
            <textarea
              id="descriptionHtml"
              className="min-h-40 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
              value={form.descriptionHtml || ''}
              onChange={(e) => updateField('descriptionHtml', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5 border-b border-gray-300 pb-6">
        <h3 className="text-3xl font-semibold text-gray-900">People (Optional)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="speakerNames">Speakers</Label>
            <Input
              id="speakerNames"
              placeholder="Jane Doe, John Doe"
              value={form.speakerNames || ''}
              onChange={(e) => updateField('speakerNames', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="organizerNames">Organizers</Label>
            <Input
              id="organizerNames"
              placeholder="OpenEvents Team"
              value={form.organizerNames || ''}
              onChange={(e) => updateField('organizerNames', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sponsorNames">Sponsors</Label>
            <Input
              id="sponsorNames"
              placeholder="Company A, Company B"
              value={form.sponsorNames || ''}
              onChange={(e) => updateField('sponsorNames', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-3xl font-semibold text-gray-900">Bottom Visual</h3>
        {form.bottomImage ? (
          <div className="overflow-hidden rounded-none bg-gray-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.bottomImage} alt="Event bottom visual" className="h-[230px] w-full object-cover sm:h-[340px]" />
          </div>
        ) : (
          <div className="flex h-[140px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
            No bottom image selected.
          </div>
        )}

        <div>
          <input
            ref={bottomInputRef}
            id="bottomImageUpload"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => onImageSelected(event, 'bottomImage')}
            className="hidden"
            disabled={isUploadingBottom}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => bottomInputRef.current?.click()}
            isLoading={isUploadingBottom}
          >
            Add bottom image
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
              value={form.visibility}
              onChange={(e) => updateField('visibility', e.target.value as EventFormData['visibility'])}
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
          <div>
            <Label htmlFor="cancellationDeadlineHours">Cancellation Deadline (hours)</Label>
            <Input
              id="cancellationDeadlineHours"
              type="number"
              min={0}
              value={form.cancellationDeadlineHours}
              onChange={(e) => updateField('cancellationDeadlineHours', Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="categoryIds">Category IDs (comma separated)</Label>
            <Input
              id="categoryIds"
              value={form.categoryIds?.join(',') || ''}
              onChange={(e) => {
                const ids = e.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
                updateField('categoryIds', ids)
              }}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => submit('save')} isLoading={isSubmitting}>
          Save Draft
        </Button>
        <Button variant="outline" onClick={() => submit('publish')} isLoading={isSubmitting}>
          Save and Publish
        </Button>
      </div>
    </div>
  )
}
