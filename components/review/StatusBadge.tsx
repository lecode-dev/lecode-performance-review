import type { CycleStatus, ReviewStatus } from '@/lib/supabase/types'

export function CycleBadge({ status }: { status: CycleStatus }) {
  const cls = status === 'open' ? 'badge badge-open dot' : 'badge badge-closed dot'
  return <span className={cls}>{status === 'open' ? 'Em andamento' : 'Encerrado'}</span>
}

export function ReviewBadge({ status }: { status: ReviewStatus | 'not_started' }) {
  const map: Record<string, [string, string]> = {
    not_started: ['badge',               'Não iniciado'],
    draft:       ['badge badge-pending', 'Rascunho'],
    submitted:   ['badge badge-done',    'Submetido'],
  }
  const [cls, label] = map[status] ?? ['badge', status]
  return <span className={cls}>{label}</span>
}
