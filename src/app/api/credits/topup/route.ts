import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe/client'

// Allowed topup amounts in euros
const ALLOWED_AMOUNTS = [5, 10, 25, 50, 100] as const
type TopupAmount = (typeof ALLOWED_AMOUNTS)[number]

/**
 * POST /api/credits/topup
 * Create a Stripe checkout session for buying credits
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body
    let body: { amountEuros?: number }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { amountEuros } = body

    // Validate amount
    if (!amountEuros || !ALLOWED_AMOUNTS.includes(amountEuros as TopupAmount)) {
      return NextResponse.json(
        {
          error: `Invalid amount. Allowed values: ${ALLOWED_AMOUNTS.join(', ')}€`,
        },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true, stripeCustomerId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          clerkId,
        },
      })
      customerId = customer.id

      // Save customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Calculate credits (1€ = 100 credits)
    const creditsToAdd = amountEuros * 100

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${creditsToAdd} Credits`,
              description: `Add ${creditsToAdd} credits to your account (${amountEuros}€)`,
            },
            unit_amount: amountEuros * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'credits',
        userId: user.id,
        amountEuros: amountEuros.toString(),
        creditsToAdd: creditsToAdd.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?credits=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?credits=cancelled`,
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Credit topup error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
