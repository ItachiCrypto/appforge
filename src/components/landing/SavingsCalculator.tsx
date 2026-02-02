'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, TrendingUp, Sparkles } from 'lucide-react'

export function SavingsCalculator() {
  const [monthlySpend, setMonthlySpend] = useState(50)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const yearlySavings = monthlySpend * 12
  const tenYearSavings = yearlySavings * 10
  
  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 300)
    return () => clearTimeout(timer)
  }, [monthlySpend])

  const presets = [
    { label: 'Minimaliste', value: 30 },
    { label: 'Standard', value: 75 },
    { label: 'Power User', value: 150 },
    { label: 'Entreprise', value: 300 },
  ]

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Calculateur d'économies</h3>
            <p className="text-sm text-zinc-400">Combien paies-tu en SaaS chaque mois ?</p>
          </div>
        </div>

        {/* Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-zinc-400 text-sm">Dépenses mensuelles</span>
            <motion.span 
              key={monthlySpend}
              initial={{ scale: 1.2, color: '#10b981' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-2xl font-bold text-white"
            >
              {monthlySpend}€/mois
            </motion.span>
          </div>
          
          <input
            type="range"
            min="10"
            max="500"
            step="5"
            value={monthlySpend}
            onChange={(e) => setMonthlySpend(Number(e.target.value))}
            className="w-full h-3 bg-zinc-700 rounded-full appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${((monthlySpend - 10) / 490) * 100}%, #3f3f46 ${((monthlySpend - 10) / 490) * 100}%, #3f3f46 100%)`
            }}
          />
          
          {/* Presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setMonthlySpend(preset.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  monthlySpend === preset.value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <p className="text-zinc-400 text-sm mb-1">Économies annuelles</p>
            <motion.p 
              key={yearlySavings}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl md:text-3xl font-bold text-emerald-400"
            >
              {yearlySavings.toLocaleString()}€
            </motion.p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-4 border border-emerald-500/30">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-emerald-400 text-sm font-medium">Sur 10 ans</p>
            </div>
            <motion.p 
              key={tenYearSavings}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl md:text-3xl font-bold text-white"
            >
              {tenYearSavings.toLocaleString()}€
            </motion.p>
          </div>
        </div>

        {/* Fun fact */}
        <AnimatePresence mode="wait">
          <motion.div
            key={Math.floor(tenYearSavings / 1000)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-start gap-2 text-sm text-zinc-400 bg-zinc-800/30 rounded-lg p-3"
          >
            <Sparkles className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <span>
              {tenYearSavings >= 10000 
                ? `💸 C'est ${Math.floor(tenYearSavings / 1500)} vacances ou ${Math.floor(tenYearSavings / 300)} restos gastronomiques !`
                : tenYearSavings >= 5000
                ? `🎸 De quoi t'offrir un MacBook Pro ou des vacances de rêve !`
                : `☕ C'est ${Math.floor(tenYearSavings / 5)} cafés que tu gardes !`
              }
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
