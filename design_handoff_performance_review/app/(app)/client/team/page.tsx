// =============================================================================
// app/(app)/client/team/page.tsx · Minha equipe (contratados alocados no cliente).
// A RLS garante que listMyTeam() só traga os alocados ao representante.
// =============================================================================

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { listMyTeam } from '@/lib/data/contractors';
import { getActiveCycle } from '@/lib/data/cycles';
import { getReview } from '@/lib/data/reviews';

export default async function ClientTeamPage() {
  await requireRole('client_rep');
  const [team, cycle] = await Promise.all([listMyTeam(), getActiveCycle()]);

  const rows = await Promise.all(
    team.map(async (c) => {
      const mine = cycle ? await getReview(cycle.id, c.id, 'client') : null;
      // self fica oculta pela RLS enquanto o ciclo está aberto → null aqui (anti-viés)
      const self = cycle ? await getReview(cycle.id, c.id, 'self') : null;
      return { contractor: c, mineSubmitted: mine?.status === 'submitted', selfVisible: !!self };
    }),
  );

  // TODO(ui): recriar ClientTeam — botão "Avaliar"/"Revisar" → /client/team/[id]/evaluate.
  return <pre>{JSON.stringify({ cycle: cycle?.label ?? null, team: rows.map((r) => ({ name: r.contractor.full_name, mine: r.mineSubmitted })) }, null, 2)}</pre>;
}
