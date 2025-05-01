'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      // Store the token
      localStorage.setItem('token', token)
      
      // Redirect to the dashboard or home page
      router.push('/dashboard')
    } else {
      // If no token, redirect to login
      router.push('/auth')
    }
  }, [token, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing login...</h1>
        <p>Please wait while we redirect you.</p>
      </div>
    </main>
  )
} 