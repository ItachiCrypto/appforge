import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
