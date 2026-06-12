function scoreTier(s: number): string {
  if (s >= 4.5) return 'tier-5'
  if (s >= 3.5) return 'tier-4'
  if (s >= 2.5) return 'tier-3'
  if (s >= 1.5) return 'tier-2'
  return 'tier-1'
}

interface ScoreCardProps {
  selfAvg:      number | null
  clientAvg:    number | null
  finalScore:   number | null
  selfWeight:   number
  clientWeight: number
}

export function ScoreCard({ selfAvg, clientAvg, finalScore, selfWeight, clientWeight }: ScoreCardProps) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Pontuação Final</h3>
      </div>
      <div className="card-pad col" style={{ gap: 16 }}>
        <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
          <span
            className={'score-chip lg' + (finalScore != null ? ' ' + scoreTier(finalScore) : '')}
            style={{ fontSize: 28 }}
          >
            {finalScore != null ? finalScore.toFixed(2) : '—'}
          </span>
          <span className="muted" style={{ fontSize: 13 }}>/ 5.00</span>
        </div>

        {finalScore != null && (
          <div className="progress">
            <span style={{ width: `${(finalScore / 5) * 100}%` }} />
          </div>
        )}

        <div className="grid grid-2" style={{ gap: 10 }}>
          <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px' }}>
            <p className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>Auto-avaliação · {Math.round(selfWeight * 100)}%</p>
            <p className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{selfAvg != null ? selfAvg.toFixed(2) : '—'}</p>
          </div>
          <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px' }}>
            <p className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>Cliente · {Math.round(clientWeight * 100)}%</p>
            <p className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{clientAvg != null ? clientAvg.toFixed(2) : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ScorePill({ score }: { score: number | null }) {
  if (score == null) return <span className="muted" style={{ fontSize: 13 }}>—</span>
  return (
    <span className={'score-chip ' + scoreTier(score)}>
      {score.toFixed(2)}
    </span>
  )
}
