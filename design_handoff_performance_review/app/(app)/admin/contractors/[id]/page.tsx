// =============================================================================
// app/(app)/admin/contractors/[id]/page.tsx · Detalhe + histórico do contratado.
// Admin enxerga self, cliente e score final de qualquer ciclo (RLS: is_admin).
// =============================================================================

import { notFound } from 'next/navigation';
import { listCycles } from '@/lib/data/cycles';
import { listContractors, listContractorHistory } from '@/lib/data/contractors';
import { getReview, getDimensionScores, getFinalScore } from '@/lib/data/reviews';

export default async function ContractorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { id } = await params;
  const { cycle: cycleParam } = await searchParams;

  const [cycles, contractors] = await Promise.all([listCycles(), listContractors()]);
  const contractor = contractors.find((c) => c.id === id);
  if (!contractor) notFound();

  const cycle = cycles.find((c) => c.id === cycleParam) ?? cycles.find((c) => c.status === 'open') ?? cycles[0];

  const [self, client, dims, score, history] = await Promise.all([
    getReview(cycle.id, id, 'self'),
    getReview(cycle.id, id, 'client'),
    getDimensionScores(cycle.id, id),
    getFinalScore(cycle.id, id),
    listContractorHistory(id),
  ]);

  // TODO(ui): recriar ContractorDetail + ReviewDetail (comparação self×cliente, radar, decisão)
  //           + botão "Editar dados" (updateContractorAction) + card "Histórico de alterações" (history).
  return <pre>{JSON.stringify({ contractor: contractor.full_name, cycle: cycle.label, hasSelf: !!self, hasClient: !!client, dims: dims.length, score, changes: history.length }, null, 2)}</pre>;
}
