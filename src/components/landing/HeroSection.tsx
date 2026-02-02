'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { SavingsCalculator } from './SavingsCalculator'

interface HeroSectionProps {
  isSignedIn: boolean
}

export function HeroSection({ isSignedIn }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen pt-32 pb-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950" />
      
      {/* Floating cancelled apps - decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-32 left-[10%] opacity-20"
        >
          <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700 relative">
            <span className="text-2xl grayscale">📝</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
          className="absolute top-48 right-[15%] opacity-20"
        >
          <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700 relative">
            <span className="text-2xl grayscale">💰</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
          className="absolute top-72 left-[20%] opacity-20"
        >
          <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700 relative">
            <span className="text-2xl grayscale">✅</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center mb-12">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-emerald-400 font-medium">Construis tes outils, garde ton argent</span>
          </motion.div>
          
          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="text-white">Unsubscribe</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              from everything.
            </span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto"
          >
            Construis tes propres outils en 10 minutes.<br />
            <span className="text-white font-medium">Ne paie plus jamais d'abonnement.</span>
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25"
              >
                {isSignedIn ? "Aller au Dashboard" : "Commence à économiser"}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            
            <a href="#calculator">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all border border-zinc-700"
              >
                Calculer mes économies
              </motion.button>
            </a>
          </motion.div>
          
          {!isSignedIn && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-zinc-500 text-sm"
            >
              Gratuit pour commencer • Pas de carte bancaire • 3 apps incluses
            </motion.p>
          )}
        </div>
        
        {/* Calculator */}
        <motion.div
          id="calculator"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <SavingsCalculator />
        </motion.div>
      </div>
    </section>
  )
}
