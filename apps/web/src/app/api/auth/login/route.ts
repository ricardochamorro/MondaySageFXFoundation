import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    const response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      return new NextResponse('Invalid credentials', { status: 401 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Login error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 