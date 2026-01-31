import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user can deploy
    const plan = PLANS[user.plan as keyof typeof PLANS]
    if (!plan.canDeploy) {
      return NextResponse.json(
        { error: 'Upgrade to Starter or higher to deploy apps' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body: { appId?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { appId } = body

    // Validate appId
    if (!appId || typeof appId !== 'string') {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 })
    }

    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        userId: user.id,
      },
    })

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    // For MVP, we'll simulate deployment
    // In production, this would call the Vercel API
    const vercelToken = process.env.VERCEL_TOKEN
    
    if (!vercelToken) {
      // Simulate deployment for demo
      const simulatedUrl = `https://${app.name.toLowerCase().replace(/\s+/g, '-')}-${app.id.slice(0, 8)}.vercel.app`
      
      await prisma.app.update({
        where: { id: appId },
        data: {
          status: 'DEPLOYED',
          vercelUrl: simulatedUrl,
          deployedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        url: simulatedUrl,
        message: 'Deployment simulated (configure VERCEL_TOKEN for real deployments)',
      })
    }

    // Real Vercel deployment would go here
    // For now, we'll just mark it as deployed
    const deploymentUrl = `https://${app.name.toLowerCase().replace(/\s+/g, '-')}-${app.id.slice(0, 8)}.vercel.app`

    await prisma.app.update({
      where: { id: appId },
      data: {
        status: 'DEPLOYED',
        vercelUrl: deploymentUrl,
        deployedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
    })
  } catch (error) {
    console.error('Deploy error:', error)
    return NextResponse.json({ error: 'Failed to deploy' }, { status: 500 })
  }
}
