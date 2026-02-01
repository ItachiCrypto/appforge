import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/prisma'
import { getPlanFromPriceId } from '@/lib/stripe/plans'
import { addCredits } from '@/lib/credits/service'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}
        
        // Handle credit topup
        if (metadata.type === 'credits' && metadata.userId && metadata.amountEuros) {
          const amountEuros = parseInt(metadata.amountEuros, 10)
          
          if (amountEuros > 0) {
            await addCredits(metadata.userId, amountEuros, session.id)
            console.log(`Added ${amountEuros * 100} credits to user ${metadata.userId}`)
          }
          break
        }
        
        // Handle subscription
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const priceId = subscription.items.data[0]?.price?.id
          const plan = getPlanFromPriceId(priceId || '')

          await prisma.user.update({
            where: { stripeCustomerId: session.customer as string },
            data: {
              plan,
              stripeSubscriptionId: subscription.id,
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price?.id
        const plan = getPlanFromPriceId(priceId || '')

        // Use updateMany to handle case where customer doesn't exist
        await prisma.user.updateMany({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            plan,
            stripeSubscriptionId: subscription.id,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Use updateMany to handle case where customer doesn't exist
        await prisma.user.updateMany({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            plan: 'FREE',
            stripeSubscriptionId: null,
          },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
