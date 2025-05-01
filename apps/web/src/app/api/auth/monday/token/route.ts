import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    // Get the Monday.com access token from the backend
    const response = await fetch(`${process.env.API_URL}/auth/monday/token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Monday.com token');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting Monday.com token:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to get Monday.com token' }), {
      status: 500,
    });
  }
}
