// =============================================================================
// app/(app)/contractor/page.tsx · Início do Contratado (CTA de autoavaliação + evolução).
// =============================================================================

import { requireRole } from '@/lib/auth';
import { getActiveCycle, listCycles } from '@/lib/data/cycles';
import { getReview, getFinalScore } from '@/lib/data/reviews';

export default async function ContractorHomePage() {
  const session = await requireRole('contractor');
  const me = session.contractorId;
  if (!me) {
    // Perfil contractor sem registro em contractors (ainda não provisionado pelo admin)
    return <pre>{JSON.stringify({ warning: 'contractor_profile_incompleto' }, null, 2)}</pre>;
  }

  const [active, cycles] = await Promise.all([getActiveCycle(), listCycles()]);
  const selfThisCycle = active ? await getReview(active.id, me, 'self') : null;

  // Evolução: score final dos ciclos encerrados (RLS libera o próprio)
  const closed = cycles.filter((c) => c.status === 'closed');
  const series = await Promise.all(
    closed.map(async (c) => ({ cycle: c.label, score: (await getFinalScore(c.id, me))?.final_score ?? null })),
  );

  // TODO(ui): recriar ContractorHome (card de CTA + Sparkline + último score/decisão).
  return <pre>{JSON.stringify({ active: active?.label ?? null, selfDone: selfThisCycle?.status === 'submitted', series }, null, 2)}</pre>;
}
