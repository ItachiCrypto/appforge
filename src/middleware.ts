import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return key && !key.includes('placeholder') && key.startsWith('pk_')
}

// Route redirections: legacy routes → new Clerk routes
const ROUTE_REDIRECTS: Record<string, string> = {
  '/login': '/sign-in',
  '/register': '/sign-up',
  '/signup': '/sign-up',
  '/signin': '/sign-in',
}

// Middleware wrapper to handle both Clerk and non-Clerk scenarios
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Handle legacy route redirects FIRST (before auth check)
  const redirectTo = ROUTE_REDIRECTS[pathname]
  if (redirectTo) {
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    return NextResponse.redirect(url)
  }
  
  // Bypass Clerk middleware when not configured
  if (!isClerkConfigured()) {
    return NextResponse.next()
  }
  
  // Use Clerk authMiddleware for v4.x
  return authMiddleware({
    publicRoutes: [
      '/',
      '/pricing',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/api/webhooks(.*)',
    ],
  })(request, {} as any)
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|sign-in|sign-up).*)', '/', '/(api|trpc)(.*)'],
}
