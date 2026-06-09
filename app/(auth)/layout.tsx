import { Star } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 bg-primary text-primary-foreground p-10 shrink-0">
        <div className="flex items-center gap-2">
          <Star size={20} />
          <span className="font-semibold text-lg">LeCode Review</span>
        </div>
        <div>
          <blockquote className="text-lg font-medium leading-relaxed">
            "Feedback estruturado é o que transforma bons profissionais em excelentes."
          </blockquote>
          <p className="mt-4 text-sm text-primary-foreground/70">Plataforma de Performance Review</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <Star size={18} />
          <span className="font-semibold">LeCode Review</span>
        </div>
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
