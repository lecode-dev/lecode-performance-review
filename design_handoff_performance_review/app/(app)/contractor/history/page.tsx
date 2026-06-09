// =============================================================================
// app/(app)/contractor/history/page.tsx · Histórico do contratado por ciclo.
// A avaliação do cliente só aparece após o encerramento (RLS); score via RPC.
// =============================================================================

import { requireRole } from '@/lib/auth';
import { listCycles } from '@/lib/data/cycles';
import { getReview, getDimensionScores, getFinalScore } from '@/lib/data/reviews';

export default async function ContractorHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const session = await requireRole('contractor');
  const me = session.contractorId!;
  const { cycle: cycleParam } = await searchParams;

  const cycles = await listCycles();
  const cycle = cycles.find((c) => c.id === cycleParam) ?? cycles[0];

  const [self, client, dims, score] = await Promise.all([
    getReview(cycle.id, me, 'self'),
    getReview(cycle.id, me, 'client'), // null enquanto aberto (anti-viés)
    getDimensionScores(cycle.id, me),
    getFinalScore(cycle.id, me), // null enquanto aberto
  ]);

  // TODO(ui): recriar ContractorHistory + ReviewDetail (perspective="contractor").
  return <pre>{JSON.stringify({ cycle: cycle.label, status: cycle.status, hasSelf: !!self, clientVisible: !!client, finalScore: score?.final_score ?? null }, null, 2)}</pre>;
}
