'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verified, setVerified] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  // Auto-verify if token is present
  useEffect(() => {
    if (token && !verified && !isVerifying) {
      setIsVerifying(true)

      fetch(`/api/auth/verify-email?token=${token}`)
        .then(async (response) => {
          // The API returns a redirect, so we check the final URL
          if (response.redirected) {
            const url = new URL(response.url)
            if (url.searchParams.get('verified') === 'true') {
              setVerified(true)
              // Redirect to login after short delay
              setTimeout(() => router.push('/login?verified=true'), 1500)
            } else if (url.searchParams.get('error')) {
              const errorType = url.searchParams.get('error')
              if (errorType === 'token_expired') {
                setError('This verification link has expired. Please request a new one.')
              } else if (errorType === 'invalid_token') {
                setError('This verification link is invalid.')
              } else {
                setError('Verification failed. Please try again.')
              }
            } else if (url.searchParams.get('message') === 'already_verified') {
              setVerified(true)
              setTimeout(() => router.push('/login?message=already_verified'), 1500)
            }
          }
        })
        .catch(() => {
          setError('An error occurred during verification.')
        })
        .finally(() => {
          setIsVerifying(false)
        })
    }
  }, [token, verified, isVerifying, router])

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Failed to resend verification email')
        return
      }

      setSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show verifying state when token is present
  if (token && isVerifying) {
    return (
      <div className="bg-white rounded-3xl shadow-[0px_10px_30px_0px_rgba(0,0,0,0.12)] px-12 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <svg
            className="h-8 w-8 animate-spin text-[#5c8bd9]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[#4a5565]">Verifying your email...</p>
        </div>
      </div>
    )
  }

  // Show verified success
  if (verified) {
    return (
      <div className="bg-white rounded-3xl shadow-[0px_10px_30px_0px_rgba(0,0,0,0.12)] px-12 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-600">Email Verified!</h1>
          <p className="mt-2 text-lg text-[#4a5565]">Your email has been verified successfully</p>
        </div>
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[#4a5565]">Redirecting you to login...</p>
        </div>
        <div className="border-t border-[#d1d5dc] mb-6" />
        <Link
          href="/login"
          className="flex h-[52px] w-full items-center justify-center rounded-[10px] bg-[#5c8bd9] text-lg font-semibold text-white shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#4a7ac8]"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  // Show error with option to resend (when token verification failed)
  if (token && error) {
    return (
      <div className="bg-white rounded-3xl shadow-[0px_10px_30px_0px_rgba(0,0,0,0.12)] px-12 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-red-600">Verification Failed</h1>
          <p className="mt-2 text-lg text-[#4a5565]">{error}</p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/verify-email"
            className="flex h-[52px] w-full items-center justify-center rounded-[10px] bg-[#5c8bd9] text-lg font-semibold text-white shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#4a7ac8]"
          >
            Request New Verification Link
          </Link>
          <Link
            href="/login"
            className="flex h-[52px] w-full items-center justify-center rounded-[10px] border border-[#d1d5dc] text-base font-semibold text-[#4a5565] transition-colors hover:bg-gray-50"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  // Resend email success
  if (success) {
    return (
      <div className="bg-white rounded-3xl shadow-[0px_10px_30px_0px_rgba(0,0,0,0.12)] px-12 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-600">Email Sent</h1>
          <p className="mt-2 text-lg text-[#4a5565]">Check your inbox for the verification link</p>
        </div>
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[#4a5565] text-center">
            If an account exists with the email you provided, we&apos;ve sent a verification link.
          </p>
          <p className="text-sm text-[#828283]">The link will expire in 24 hours.</p>
        </div>
        <div className="border-t border-[#d1d5dc] mb-6" />
        <Link
          href="/login"
          className="flex h-[52px] w-full items-center justify-center rounded-[10px] border border-[#d1d5dc] text-base font-semibold text-[#4a5565] transition-colors hover:bg-gray-50"
        >
          Back to Login
        </Link>
      </div>
    )
  }

  // Default: resend verification form
  return (
    <div className="bg-white rounded-3xl shadow-[0px_10px_30px_0px_rgba(0,0,0,0.12)] px-12 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-black">Verify your email</h1>
        <p className="mt-2 text-lg text-[#4a5565]">Enter your email to receive a new verification link</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-[#4a5565] text-center">
          Didn&apos;t receive the verification email? Enter your email address below and we&apos;ll send you a new one.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-base font-semibold text-black">Email address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#828283] pointer-events-none" />
            <input
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              disabled={isLoading}
              className="h-12 w-full rounded-[10px] bg-[#f2f2f4] pl-12 pr-4 text-base placeholder:text-[#828283] focus:outline-none focus:ring-2 focus:ring-[#5c8bd9] disabled:opacity-50"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-[52px] w-full items-center justify-center rounded-[10px] bg-[#5c8bd9] text-lg font-semibold text-white shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#4a7ac8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            'Resend verification email'
          )}
        </button>
      </form>

      <div className="border-t border-[#d1d5dc] mt-6" />
      <p className="mt-6 text-center text-base text-[#4a5565]">
        Already verified?{' '}
        <Link href="/login" className="font-semibold text-[#5c8bd9] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl shadow-[0px_10px_30px_0px_rgba(0,0,0,0.12)] px-12 py-12">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <svg
              className="h-8 w-8 animate-spin text-[#5c8bd9]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[#4a5565]">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
