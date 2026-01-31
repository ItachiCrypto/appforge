import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

interface WebhookEvent {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string
  }
}

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (evt.type) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data
        const email = email_addresses[0]?.email_address

        if (email) {
          await prisma.user.create({
            data: {
              clerkId: id,
              email,
              name: [first_name, last_name].filter(Boolean).join(' ') || null,
              imageUrl: image_url,
            },
          })
        }
        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data
        const email = email_addresses[0]?.email_address

        if (email) {
          // Use upsert to handle case where user doesn't exist
          await prisma.user.upsert({
            where: { clerkId: id },
            update: {
              email,
              name: [first_name, last_name].filter(Boolean).join(' ') || null,
              imageUrl: image_url,
            },
            create: {
              clerkId: id,
              email,
              name: [first_name, last_name].filter(Boolean).join(' ') || null,
              imageUrl: image_url,
            },
          })
        }
        break
      }

      case 'user.deleted': {
        const { id } = evt.data

        // Use deleteMany to avoid error if user doesn't exist
        await prisma.user.deleteMany({
          where: { clerkId: id },
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
