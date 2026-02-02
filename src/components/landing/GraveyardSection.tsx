'use client'

import { motion } from 'framer-motion'
import { Skull, TrendingUp, X, PartyPopper } from 'lucide-react'

const cancelledApps = [
  { name: 'Notion', price: 96, cancelDate: '2024', icon: '📝' },
  { name: 'Todoist', price: 48, cancelDate: '2024', icon: '✅' },
  { name: 'Calendly', price: 144, cancelDate: '2024', icon: '📅' },
  { name: 'Finary', price: 100, cancelDate: '2024', icon: '💰' },
  { name: 'Habit Tracker', price: 36, cancelDate: '2024', icon: '🎯' },
]

const totalSaved = cancelledApps.reduce((sum, app) => sum + app.price, 0)

const testimonials = [
  {
    quote: "J'ai annulé 5 abonnements le même jour. Liberté totale.",
    author: 'Marc D.',
    savings: '424€/an',
    avatar: '🧑‍💻',
  },
  {
    quote: "Mon app de budget est EXACTEMENT comme je la veux. Pas de features inutiles.",
    author: 'Sophie L.',
    savings: '156€/an',
    avatar: '👩‍🎨',
  },
  {
    quote: "Le feeling de cliquer 'Annuler l'abonnement' 😌",
    author: 'Thomas B.',
    savings: '288€/an',
    avatar: '🧑‍🔬',
  },
]

export function GraveyardSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 mb-6">
            <Skull className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-400">SaaS Graveyard</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            R.I.P. les abonnements
          </h2>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Eux aussi ont dit adieu aux paiements récurrents
          </p>
        </motion.div>

        {/* Tombstones */}
        <div className="flex flex-wrap justify-center gap-4 mb-16 max-w-3xl mx-auto">
          {cancelledApps.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, y: 20, rotate: -5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 w-32 text-center relative overflow-hidden">
                {/* R.I.P. effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                
                <div className="relative">
                  <span className="text-3xl grayscale">{app.icon}</span>
                  <p className="font-medium text-zinc-400 mt-2 line-through">{app.name}</p>
                  <p className="text-zinc-500 text-sm">{app.price}€/an</p>
                  
                  {/* Cancelled badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total saved counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto mb-16"
        >
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Économies cumulées</span>
            </div>
            <motion.p 
              className="text-5xl font-bold text-white"
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
            >
              {totalSaved}€
              <span className="text-2xl text-zinc-400">/an</span>
            </motion.p>
            <p className="text-emerald-400/80 text-sm mt-2">
              Pour UN utilisateur. Imagine ta team. 🚀
            </p>
          </div>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
            >
              <p className="text-zinc-300 mb-4 italic">"{testimonial.quote}"</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{testimonial.avatar}</span>
                  <span className="text-zinc-400 font-medium">{testimonial.author}</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                  -{testimonial.savings}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fun celebration */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 text-zinc-500">
            <PartyPopper className="w-5 h-5" />
            <span>Chaque annulation est une victoire</span>
            <PartyPopper className="w-5 h-5" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
