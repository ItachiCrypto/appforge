import { PrismaClient } from '@prisma/client'

// PrismaClient optimisé pour Vercel Serverless
// - Connection pooling via DATABASE_URL (avec ?pgbouncer=true si Supabase/Neon)
// - Gestion des cold starts avec singleton global
// - Limite de connexions pour éviter les exhaustions

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    // Optimisations pour serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Déclaration globale pour TypeScript
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

// Singleton pattern pour éviter les multiples connexions en dev/serverless
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

// En développement, on garde l'instance en global pour le hot reload
// En production serverless, chaque cold start crée une nouvelle instance
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

// Helper pour fermer proprement la connexion si nécessaire
export async function disconnect() {
  await prisma.$disconnect()
}
