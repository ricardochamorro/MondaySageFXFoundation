'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@mondaysagefx/ui'
import { MondayLoginButton } from './monday-login-button'

export function LoginForm() {
  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Welcome to Monday Sage FX</CardTitle>
        <CardDescription>Sign in with your Monday.com account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <MondayLoginButton />
      </CardContent>
    </Card>
  )
} 