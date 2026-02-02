'use client'

import { motion } from 'framer-motion'
import { Sparkles, Clock, Check, Star } from 'lucide-react'
import Link from 'next/link'

const templates = [
  {
    name: 'Clone de Notion',
    icon: '📝',
    savings: 96,
    time: '8 min',
    features: ['Notes hiérarchiques', 'Bases de données', 'Templates'],
    popular: true,
  },
  {
    name: 'Clone de Finary',
    icon: '💰',
    savings: 100,
    time: '12 min',
    features: ['Suivi patrimoine', 'Graphiques', 'Multi-comptes'],
    popular: true,
  },
  {
    name: 'Clone de Todoist',
    icon: '✅',
    savings: 48,
    time: '5 min',
    features: ['Projets & tags', 'Dates limites', 'Priorités'],
    popular: false,
  },
  {
    name: 'Clone de Calendly',
    icon: '📅',
    savings: 144,
    time: '10 min',
    features: ['Créneaux dispo', 'Sync calendrier', 'Rappels'],
    popular: false,
  },
  {
    name: 'Habit Tracker',
    icon: '🎯',
    savings: 36,
    time: '6 min',
    features: ['Streaks', 'Statistiques', 'Rappels'],
    popular: false,
  },
  {
    name: 'Expense Tracker',
    icon: '💳',
    savings: 60,
    time: '7 min',
    features: ['Catégories custom', 'Graphiques', 'Budget'],
    popular: false,
  },
]

export function TemplatesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm text-violet-400">Templates populaires</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Clone tes apps préférées
          </h2>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Démarre avec un template et personnalise-le à 100%. Ou pars de zéro.
          </p>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {templates.map((template, i) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-violet-500/50 transition-all h-full">
                {/* Popular badge */}
                {template.popular && (
                  <div className="absolute -top-3 -right-3 flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    <Star className="w-3 h-3" />
                    Populaire
                  </div>
                )}
                
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{template.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg text-white">{template.name}</h3>
                      <div className="flex items-center gap-1 text-zinc-500 text-sm">
                        <Clock className="w-3 h-3" />
                        {template.time}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {template.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {/* Savings badge */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <span className="text-sm text-zinc-500">Tu économises</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                    {template.savings}€/an
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-zinc-400 mb-4">
            + des dizaines d'autres templates ou crée le tien de A à Z
          </p>
          <Link href="/sign-up">
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-semibold px-8 py-3 rounded-xl transition-all">
              Voir tous les templates
              <Sparkles className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
