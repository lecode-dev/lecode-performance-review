import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreCard, ScorePill } from '@/components/review/ScoreCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContractorDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'lecode_admin') redirect('/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, client_id')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('github_handle, skills')
    .eq('id', id)
    .single()

  const { data: allocations } = await supabase
    .from('allocations')
    .select('id, started_on, ended_on, clients(name)')
    .eq('contractor_id', id)
    .order('started_on', { ascending: false })

  const { data: history } = await supabase
    .from('contractor_history')
    .select('*, cycles(name, status)')
    .eq('contractor_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/contractors">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={15} /> Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{profile.full_name}</h1>
          <p className="text-muted-foreground text-sm">{profile.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Dados</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Role"    value={profile.role} />
            <Row label="GitHub"  value={contractor?.github_handle ?? '—'} />
            <Row label="Skills"  value={contractor?.skills?.join(', ') ?? '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Alocações</CardTitle></CardHeader>
          <CardContent>
            {allocations?.length ? (
              <ul className="text-sm space-y-2">
                {allocations.map((a) => {
                  const client = (a.clients as { name: string } | null)
                  return (
                    <li key={a.id} className="flex justify-between">
                      <span>{client?.name ?? '—'}</span>
                      <span className="text-muted-foreground text-xs">
                        {a.started_on} → {a.ended_on ?? 'atual'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sem alocações.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de scores */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Histórico de Scores</CardTitle></CardHeader>
        <CardContent>
          {history?.length ? (
            <div className="divide-y divide-border">
              {history.map((h) => {
                const cycle = (h.cycles as { name: string; status: string } | null)
                return (
                  <div key={h.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{cycle?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Self: {h.self_avg?.toFixed(2) ?? '—'} · Cliente: {h.client_avg?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                    <ScorePill score={h.final_score} />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum ciclo fechado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
