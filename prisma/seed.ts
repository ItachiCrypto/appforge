import { PrismaClient, Provider } from '@prisma/client'

const prisma = new PrismaClient()

// Prix de base des modèles (coût réel API)
// On ajoute 10% de marge pour le pricing final
const AI_MODELS = [
  // Anthropic
  {
    provider: Provider.ANTHROPIC,
    modelId: 'claude-opus-4',
    displayName: 'Claude Opus 4',
    inputCostPer1M: 15,    // $15/1M input tokens
    outputCostPer1M: 75,   // $75/1M output tokens
  },
  {
    provider: Provider.ANTHROPIC,
    modelId: 'claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    inputCostPer1M: 3,
    outputCostPer1M: 15,
  },
  {
    provider: Provider.ANTHROPIC,
    modelId: 'claude-haiku-3.5',
    displayName: 'Claude Haiku 3.5',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
  },
  // OpenAI
  {
    provider: Provider.OPENAI,
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
  },
  {
    provider: Provider.OPENAI,
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
  },
  {
    provider: Provider.OPENAI,
    modelId: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    inputCostPer1M: 10,
    outputCostPer1M: 30,
  },
  {
    provider: Provider.OPENAI,
    modelId: 'o1',
    displayName: 'o1',
    inputCostPer1M: 15,
    outputCostPer1M: 60,
  },
  {
    provider: Provider.OPENAI,
    modelId: 'o1-mini',
    displayName: 'o1 Mini',
    inputCostPer1M: 3,
    outputCostPer1M: 12,
  },
]

async function main() {
  console.log('🌱 Seeding AI models...')
  
  for (const model of AI_MODELS) {
    const created = await prisma.aIModel.upsert({
      where: { modelId: model.modelId },
      update: {
        displayName: model.displayName,
        inputCostPer1M: model.inputCostPer1M,
        outputCostPer1M: model.outputCostPer1M,
        provider: model.provider,
      },
      create: {
        provider: model.provider,
        modelId: model.modelId,
        displayName: model.displayName,
        inputCostPer1M: model.inputCostPer1M,
        outputCostPer1M: model.outputCostPer1M,
        isAvailable: true,
      },
    })
    console.log(`  ✓ ${created.displayName} (${created.modelId})`)
  }
  
  console.log(`\n✅ Seeded ${AI_MODELS.length} AI models`)
  console.log('\n📊 Pricing (coût réel, +10% marge appliquée à l\'usage):')
  console.log('┌─────────────────────┬──────────┬────────────┬─────────────┐')
  console.log('│ Model               │ Provider │ Input $/1M │ Output $/1M │')
  console.log('├─────────────────────┼──────────┼────────────┼─────────────┤')
  for (const m of AI_MODELS) {
    const name = m.displayName.padEnd(19)
    const prov = m.provider.padEnd(8)
    const inp = m.inputCostPer1M.toFixed(2).padStart(10)
    const out = m.outputCostPer1M.toFixed(2).padStart(11)
    console.log(`│ ${name} │ ${prov} │ ${inp} │ ${out} │`)
  }
  console.log('└─────────────────────┴──────────┴────────────┴─────────────┘')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
