import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headersList = headers();
    const authHeader = headersList.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Get the Monday.com access token from the backend
    const response = await fetch(`${process.env.API_URL}/auth/monday/token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || 'Failed to get Monday.com token';

      // If the error is about missing Monday.com account, redirect to error page
      if (errorMessage.includes('No Monday.com account found')) {
        return NextResponse.redirect(
          new URL(
            '/auth/error?message=' + encodeURIComponent(errorMessage),
            process.env.FRONTEND_URL
          )
        );
      }

      return new NextResponse(JSON.stringify({ error: errorMessage }), { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Monday.com token route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
