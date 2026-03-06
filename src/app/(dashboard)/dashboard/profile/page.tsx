import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireOrganizerProfile } from '@/lib/dashboard/organizer'

export default async function OrganizerProfilePage() {
  const { user, organizerProfile } = await requireOrganizerProfile()

  // Super admins without organizer profiles should use the admin panel
  if (!organizerProfile) {
    redirect('/admin')
  }

  const socialLinks = (organizerProfile.socialLinks as Record<string, string> | null) || {}

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organizerProfile.orgName}</h1>
            <p className="mt-1 text-sm text-gray-600">Organizer profile</p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit Profile
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 text-sm text-gray-700 sm:grid-cols-2">
          <div>
            <p className="font-medium text-gray-900">Contact Email</p>
            <p className="mt-1">{user.email}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Website</p>
            <p className="mt-1">
              {organizerProfile.website ? (
                <a
                  href={organizerProfile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#5C8BD9] hover:underline"
                >
                  {organizerProfile.website}
                </a>
              ) : (
                'Not set'
              )}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-medium text-gray-900">About</p>
            <p className="mt-1 whitespace-pre-wrap">{organizerProfile.description || 'No description yet.'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">LinkedIn</p>
            <p className="mt-1">{socialLinks.linkedin || 'Not set'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
