import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      DIRECT_URL: process.env.DIRECT_URL ? 'SET (hidden)' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    },
    database: 'pending',
    error: null as string | null,
  }

  try {
    // Test raw connection
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    checks.database = 'connected'
    
    // Test model query
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'healthy',
      ...checks,
      userCount,
    })
  } catch (error: any) {
    checks.database = 'failed'
    checks.error = error.message || String(error)
    
    return NextResponse.json({
      status: 'unhealthy',
      ...checks,
      errorCode: error.code,
      errorMeta: error.meta,
    }, { status: 500 })
  }
}
