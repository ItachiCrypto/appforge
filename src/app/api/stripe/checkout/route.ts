import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { stripe, createCheckoutSession, createCustomer } from '@/lib/stripe/client'
import { STRIPE_PLANS } from '@/lib/stripe/plans'
import { absoluteUrl } from '@/lib/utils'
import { Plan } from '@prisma/client'

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

    const { plan } = await req.json()

    if (!plan || plan === 'FREE' || !STRIPE_PLANS[plan as Exclude<Plan, 'FREE'>]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const stripePlan = STRIPE_PLANS[plan as Exclude<Plan, 'FREE'>]

    // Create Stripe customer if not exists
    let customerId = user.stripeCustomerId
    
    if (!customerId) {
      const customer = await createCustomer(user.email, user.name || undefined)
      customerId = customer.id
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      stripePlan.priceId,
      absoluteUrl('/billing?success=true'),
      absoluteUrl('/billing?canceled=true')
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
