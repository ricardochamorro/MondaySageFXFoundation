'use client'

import { Button } from '@mondaysagefx/ui'

export function MondayLoginButton() {
  const handleMondayLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://monday.sagefxfoundation.com'
    window.location.href = `${apiUrl}/api/auth/monday`
  }

  return (
    <Button
      onClick={handleMondayLogin}
      className="w-full bg-[#0073EA] hover:bg-[#0060C2] text-white"
    >
      Continue with Monday.com
    </Button>
  )
} 