import { Loader2 } from 'lucide-react'

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-500" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
