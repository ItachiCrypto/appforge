import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes publiques - pas d'auth requise
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

// Redirections legacy
const ROUTE_REDIRECTS: Record<string, string> = {
  '/login': '/sign-in',
  '/register': '/sign-up',
  '/signup': '/sign-up',
  '/signin': '/sign-in',
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  
  // Handle legacy route redirects
  const redirectTo = ROUTE_REDIRECTS[pathname]
  if (redirectTo) {
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    return NextResponse.redirect(url)
  }
  
  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
