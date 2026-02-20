// Middleware to protect routes
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Skip auth for API routes and static files
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/worker') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionId = request.cookies.get('jarvis_session')?.value

  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login).*)'],
}
