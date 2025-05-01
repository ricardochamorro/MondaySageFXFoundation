'use client'

import { Button } from '@mondaysagefx/ui'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">Monday Sage FX</h1>
        <Button onClick={() => router.push('/auth')}>Get Started</Button>
      </div>
    </main>
  )
} 