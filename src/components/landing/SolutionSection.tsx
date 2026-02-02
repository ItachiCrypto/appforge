'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Sparkles, Check, ArrowRight, Zap } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: MessageSquare,
    title: 'Décris',
    description: 'Explique ce que tu veux en français simple. Pas besoin de coder.',
    example: '"Je veux un tracker de budget comme Finary, mais avec mes catégories"',
    color: 'from-violet-500 to-violet-600',
  },
  {
    number: '02',
    icon: Sparkles,
    title: "L'IA construit",
    description: "En 2-3 minutes, ton app est prête. Design moderne, fonctionnelle.",
    example: 'Notre IA génère le code, le design, tout.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    number: '03',
    icon: Check,
    title: 'Utilise pour toujours',
    description: "C'est TON app. Pas d'abonnement. Pas de limite. Pour toujours.",
    example: 'Exporte, modifie, héberge où tu veux.',
    color: 'from-emerald-500 to-emerald-600',
  },
]

export function SolutionSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-emerald-950/5 to-zinc-950" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-emerald-400">La solution</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Construis{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              tes propres outils
            </span>
          </h2>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            En 10 minutes. Gratuit pour toujours. Adapté à TES besoins.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px]">
                  <div className="h-full bg-gradient-to-r from-zinc-700 to-transparent" />
                  <ArrowRight className="absolute -right-2 -top-2 w-4 h-4 text-zinc-600" />
                </div>
              )}
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all h-full">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-4xl font-bold text-zinc-700">{step.number}</span>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-zinc-400 mb-4">{step.description}</p>
                
                {/* Example */}
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <p className="text-sm text-zinc-300 italic">"{step.example}"</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo Video Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-zinc-500 text-sm ml-2">appforge.app/editor</span>
            </div>
            
            {/* Content */}
            <div className="aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <p className="text-zinc-400 text-lg">Démo vidéo bientôt disponible</p>
                <p className="text-zinc-500 text-sm mt-2">Voir l'IA construire une app en temps réel</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
