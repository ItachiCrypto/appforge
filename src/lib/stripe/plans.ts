import { Plan } from '@prisma/client'

export const STRIPE_PLANS: Record<Exclude<Plan, 'FREE'>, { priceId: string; name: string; price: number }> = {
  STARTER: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    name: 'Starter',
    price: 19,
  },
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: 'Pro',
    price: 49,
  },
  TEAM: {
    priceId: process.env.STRIPE_TEAM_PRICE_ID!,
    name: 'Team',
    price: 99,
  },
  ENTERPRISE: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'contact-sales',
    name: 'Enterprise',
    price: 0, // Custom pricing
  },
}

export function getPlanFromPriceId(priceId: string): Plan {
  for (const [plan, data] of Object.entries(STRIPE_PLANS)) {
    if (data.priceId === priceId) {
      return plan as Plan
    }
  }
  return 'FREE'
}
