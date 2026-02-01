import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { getBalance, getUsageHistory, creditsToEuros } from '@/lib/credits'

/**
 * GET /api/credits
 * Get user's credit balance and recent usage history
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get balance and usage
    const [balance, recentUsage] = await Promise.all([
      getBalance(user.id),
      getUsageHistory(user.id, 20),
    ])

    return NextResponse.json({
      balance,
      balanceEuros: creditsToEuros(balance),
      recentUsage: recentUsage.map((u) => ({
        id: u.id,
        model: u.modelId,
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        creditsUsed: u.creditsUsed,
        costEuros: creditsToEuros(u.creditsUsed),
        usedByok: u.usedByok,
        createdAt: u.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Credits fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}
