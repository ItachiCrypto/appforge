import { authMiddleware } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/pricing',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
  ],
  beforeAuth: (request) => {
    // Handle legacy route redirects
    const { pathname } = request.nextUrl
    const ROUTE_REDIRECTS: Record<string, string> = {
      '/login': '/sign-in',
      '/register': '/sign-up',
      '/signup': '/sign-up',
      '/signin': '/sign-in',
    }
    
    const redirectTo = ROUTE_REDIRECTS[pathname]
    if (redirectTo) {
      const url = request.nextUrl.clone()
      url.pathname = redirectTo
      return NextResponse.redirect(url)
    }
    
    return NextResponse.next()
  },
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
