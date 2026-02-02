'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Menu, X, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface NavbarProps {
  isSignedIn: boolean
}

export function Navbar({ isSignedIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800"
    >
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl text-white">AppForge</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#calculator" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
              Calculateur
            </a>
            <a href="#templates" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
              Templates
            </a>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
              Tarifs
            </a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-500">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    Connexion
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-emerald-600 hover:bg-emerald-500">
                    Commencer
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-zinc-800"
          >
            <div className="flex flex-col gap-4">
              <a 
                href="#calculator" 
                className="text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Calculateur
              </a>
              <a 
                href="#templates" 
                className="text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Templates
              </a>
              <a 
                href="#pricing" 
                className="text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tarifs
              </a>
              
              <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800">
                {isSignedIn ? (
                  <Link href="/dashboard">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in">
                      <Button variant="outline" className="w-full border-zinc-700">
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
                        Commencer gratuitement
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
