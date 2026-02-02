'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, Mail, Twitter, Github } from 'lucide-react'

interface FooterCTAProps {
  isSignedIn: boolean
}

export function FooterCTA({ isSignedIn }: FooterCTAProps) {
  return (
    <>
      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 via-zinc-950 to-zinc-950" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
              
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Rejoins le mouvement
              </h2>
              
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent mb-6">
                Unsubscribe from everything.
              </p>
              
              <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                Arrête de payer pour des outils génériques.<br />
                Construis les tiens. Pour toujours.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all w-full sm:w-auto justify-center"
                  >
                    {isSignedIn ? "Aller au Dashboard" : "Commence à économiser"}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                
                <Link href="#calculator">
                  <button className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all border border-zinc-700 w-full sm:w-auto justify-center">
                    Calculer mes économies
                  </button>
                </Link>
              </div>
              
              {!isSignedIn && (
                <p className="text-zinc-500 mt-6 text-sm">
                  Gratuit pour commencer • Pas de carte bancaire • 3 apps incluses
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">AppForge</span>
            </div>
            
            {/* Tagline */}
            <p className="text-zinc-500 text-center">
              Unsubscribe from everything. Build your own.
            </p>
            
            {/* Links */}
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-zinc-500 hover:text-white transition-colors text-sm">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-zinc-500 hover:text-white transition-colors text-sm">
                CGU
              </Link>
              <a href="mailto:hello@appforge.app" className="text-zinc-500 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/appforge" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
            <p className="text-zinc-600 text-sm">
              © 2024 AppForge. Fait avec 💚 pour ceux qui en ont marre des abonnements.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
