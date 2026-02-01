import { NextResponse } from 'next/server'

// Endpoint de diagnostic PUBLIC pour debug DB
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DIRECT_URL_SET: !!process.env.DIRECT_URL,
      DATABASE_URL_START: process.env.DATABASE_URL?.substring(0, 30) + '...',
      DIRECT_URL_START: process.env.DIRECT_URL?.substring(0, 30) + '...',
    },
    prisma: {
      status: 'checking...' as string,
      clientLoaded: false,
      queryDuration: null as string | null,
      rawResult: null as unknown,
      userCount: null as number | null,
      error: null as unknown,
    },
  }

  try {
    // Import dynamique pour voir si le client existe
    const { prisma } = await import('@/lib/prisma')
    
    diagnostics.prisma.clientLoaded = true
    
    // Test simple query
    const start = Date.now()
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as server_time`
    const duration = Date.now() - start
    
    diagnostics.prisma.status = 'connected'
    diagnostics.prisma.queryDuration = `${duration}ms`
    diagnostics.prisma.rawResult = result
    
    // Test user count
    const userCount = await prisma.user.count()
    diagnostics.prisma.userCount = userCount
    
  } catch (error) {
    diagnostics.prisma.status = 'error'
    diagnostics.prisma.error = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    } : String(error)
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
