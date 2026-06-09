import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CycleStatus, ReviewStatus } from '@/lib/supabase/types'

interface CycleBadgeProps {
  status: CycleStatus
  className?: string
}

export function CycleBadge({ status, className }: CycleBadgeProps) {
  return (
    <Badge
      className={cn(
        'text-xs font-medium',
        status === 'open'
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : 'bg-zinc-100 text-zinc-600 border-zinc-200',
        className,
      )}
      variant="outline"
    >
      {status === 'open' ? 'Aberto' : 'Fechado'}
    </Badge>
  )
}

interface ReviewBadgeProps {
  status: ReviewStatus | 'not_started'
  className?: string
}

export function ReviewBadge({ status, className }: ReviewBadgeProps) {
  const config = {
    not_started: { label: 'Não iniciado', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
    draft:       { label: 'Rascunho',      cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    submitted:   { label: 'Submetido',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  }[status]

  return (
    <Badge className={cn('text-xs font-medium', config.cls, className)} variant="outline">
      {config.label}
    </Badge>
  )
}
