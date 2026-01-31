import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function auth() {
  const { userId } = clerkAuth()
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      imageUrl: true,
      plan: true,
      openaiKey: true,
    },
  })

  if (!user) {
    // User exists in Clerk but not in our DB - create them
    const clerkUser = await currentUser()
    
    if (clerkUser) {
      const newUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null,
          imageUrl: clerkUser.imageUrl,
        },
      })
      
      return {
        user: {
          ...newUser,
          credits: 100, // Default credits
        },
      }
    }
    
    return null
  }

  return {
    user: {
      ...user,
      credits: 100, // TODO: Calculate from usage
    },
  }
}

export async function requireAuth() {
  const session = await auth()
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  return session
}
