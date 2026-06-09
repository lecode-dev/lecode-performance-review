import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { ScorePill } from '@/components/review/ScoreCard'
import { ExternalLink } from 'lucide-react'

export default async function ContractorsListPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'lecode_admin') redirect('/admin')

  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, profiles(full_name, email)')
    .order('id')

  // Último score de cada contratado
  const { data: latestHistory } = await supabase
    .from('contractor_history')
    .select('contractor_id, final_score, cycles(name)')
    .order('created_at', { ascending: false })

  const latestByContractor = new Map<string, { final_score: number | null; cycleName: string }>()
  for (const h of latestHistory ?? []) {
    if (!latestByContractor.has(h.contractor_id)) {
      const cycle = (h.cycles as { name: string } | null)
      latestByContractor.set(h.contractor_id, { final_score: h.final_score, cycleName: cycle?.name ?? '' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contratados</h1>
        <p className="text-muted-foreground text-sm mt-1">Todos os contratados registrados na plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contractors?.map((c) => {
          const p       = (c.profiles as { full_name: string; email: string } | null)
          const history = latestByContractor.get(c.id)

          return (
            <Card key={c.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p?.email}</p>
                  </div>
                  <Link href={`/admin/contractors/${c.id}`} className="text-muted-foreground hover:text-foreground shrink-0">
                    <ExternalLink size={15} />
                  </Link>
                </div>
                {history && (
                  <div className="mt-3 flex items-center gap-2">
                    <ScorePill score={history.final_score} />
                    <span className="text-xs text-muted-foreground">{history.cycleName}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {!contractors?.length && (
          <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">
            Nenhum contratado cadastrado.
          </p>
        )}
      </div>
    </div>
  )
}
