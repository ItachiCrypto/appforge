'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, CreditCard, Repeat, X } from 'lucide-react'

const saasApps = [
  { name: 'Notion', price: 96, icon: '📝', color: 'from-zinc-600 to-zinc-700' },
  { name: 'Finary', price: 100, icon: '💰', color: 'from-emerald-600 to-emerald-700' },
  { name: 'Todoist', price: 48, icon: '✅', color: 'from-red-600 to-red-700' },
  { name: 'Calendly', price: 144, icon: '📅', color: 'from-blue-600 to-blue-700' },
  { name: 'Habit Tracker', price: 36, icon: '🎯', color: 'from-purple-600 to-purple-700' },
  { name: 'Expense App', price: 60, icon: '💳', color: 'from-orange-600 to-orange-700' },
  { name: 'Password Manager', price: 36, icon: '🔐', color: 'from-cyan-600 to-cyan-700' },
  { name: 'Notes App', price: 48, icon: '📋', color: 'from-yellow-600 to-yellow-700' },
]

const totalAnnual = saasApps.reduce((sum, app) => sum + app.price, 0)

export function ProblemSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-red-950/10 to-zinc-950" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-400">Le problème</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Tu paies{' '}
            <span className="text-red-500 line-through decoration-4">{totalAnnual}€/an</span>
            <br />
            pour des outils génériques
          </h2>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Des abonnements qui s'accumulent. Des fonctionnalités que tu n'utilises pas.
            Et ça ne finit jamais.
          </p>
        </motion.div>

        {/* SaaS Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          {saasApps.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative group"
            >
              <div className={`bg-gradient-to-br ${app.color} rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{app.icon}</span>
                  <div className="flex items-center gap-1 text-white/60">
                    <Repeat className="w-3 h-3" />
                    <span className="text-xs">récurrent</span>
                  </div>
                </div>
                <p className="font-medium text-white">{app.name}</p>
                <p className="text-white/80 text-sm">{app.price}€/an</p>
              </div>
              
              {/* Cancel badge on hover */}
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                whileHover={{ scale: 1.2 }}
              >
                <X className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-8 py-4">
            <CreditCard className="w-6 h-6 text-red-400" />
            <div className="text-left">
              <p className="text-zinc-400 text-sm">Total annuel pour des outils "standard"</p>
              <p className="text-3xl font-bold text-red-400">{totalAnnual}€ - 2000€/an</p>
            </div>
          </div>
          
          <p className="text-zinc-500 mt-6 text-sm">
            Et ce n'est que la partie visible... sans compter les apps que tu as oubliées.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
