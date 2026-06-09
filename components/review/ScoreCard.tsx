import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ScoreCardProps {
  selfAvg:      number | null
  clientAvg:    number | null
  finalScore:   number | null
  selfWeight:   number
  clientWeight: number
  className?:   string
}

export function ScoreCard({
  selfAvg, clientAvg, finalScore, selfWeight, clientWeight, className,
}: ScoreCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Pontuação Final</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Final score highlight */}
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold tabular-nums">
            {finalScore != null ? finalScore.toFixed(2) : '—'}
          </span>
          <span className="text-muted-foreground text-sm mb-1">/ 5.00</span>
        </div>

        {/* Score bar */}
        {finalScore != null && (
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                finalScore >= 4 ? 'bg-emerald-500' :
                finalScore >= 3 ? 'bg-amber-400' : 'bg-red-400',
              )}
              style={{ width: `${(finalScore / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <ScoreItem
            label="Auto-avaliação"
            value={selfAvg}
            weight={selfWeight}
          />
          <ScoreItem
            label="Cliente"
            value={clientAvg}
            weight={clientWeight}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreItem({
  label, value, weight,
}: {
  label: string
  value: number | null
  weight: number
}) {
  return (
    <div className="bg-muted/60 rounded-lg px-3 py-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold tabular-nums">
        {value != null ? value.toFixed(2) : '—'}
      </p>
      <p className="text-xs text-muted-foreground">peso {Math.round(weight * 100)}%</p>
    </div>
  )
}

interface ScorePillProps {
  score:    number | null
  className?: string
}

export function ScorePill({ score, className }: ScorePillProps) {
  if (score == null) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums',
      score >= 4 ? 'bg-emerald-100 text-emerald-700' :
      score >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700',
      className,
    )}>
      {score.toFixed(2)}
    </span>
  )
}
