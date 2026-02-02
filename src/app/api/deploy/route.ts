/**
 * Deploy API Route
 * 
 * Deploys user apps to Cloudflare Pages (free tier).
 * Falls back to simulated deployment if Cloudflare is not configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/constants'
import { deployToCloudflare } from '@/lib/deploy/cloudflare'

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
        { error: 'Upgrade to PRO or higher to deploy apps' },
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

    // Get app files
    const files = app.files as Record<string, string>
    
    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json({ error: 'App has no files to deploy' }, { status: 400 })
    }

    // Check if Cloudflare is configured
    const hasCloudflare = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN

    if (hasCloudflare) {
      // Deploy to Cloudflare Pages
      const result = await deployToCloudflare(app.id, app.name, files)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Deployment failed' },
          { status: 500 }
        )
      }

      // Update app with deployment info
      await prisma.app.update({
        where: { id: appId },
        data: {
          status: 'DEPLOYED',
          vercelUrl: result.url, // Reusing vercelUrl field for any deployment URL
          deployedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        url: result.url,
        deploymentId: result.deploymentId,
        provider: 'cloudflare',
      })
    }

    // Fallback: Simulate deployment for demo/dev
    const simulatedUrl = `https://appforge-${app.id.slice(0, 8)}.pages.dev`
    
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
      provider: 'simulated',
      message: 'Deployment simulated. Configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN for real deployments.',
    })

  } catch (error) {
    console.error('Deploy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deploy' },
      { status: 500 }
    )
  }
}
