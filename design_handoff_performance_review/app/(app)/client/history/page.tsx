// =============================================================================
// app/(app)/client/history/page.tsx · Histórico por ciclo (somente do seu cliente).
// A self só aparece após o encerramento (RLS); o score final via get_final_score.
// =============================================================================

import { listMyTeam } from '@/lib/data/contractors';
import { listCycles } from '@/lib/data/cycles';
import { getReview, getFinalScore } from '@/lib/data/reviews';

export default async function ClientHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { cycle: cycleParam } = await searchParams;
  const [team, cycles] = await Promise.all([listMyTeam(), listCycles()]);
  const cycle = cycles.find((c) => c.id === cycleParam) ?? cycles[0];

  const rows = await Promise.all(
    team.map(async (c) => {
      const [mine, self, score] = await Promise.all([
        getReview(cycle.id, c.id, 'client'),
        getReview(cycle.id, c.id, 'self'), // null enquanto aberto (anti-viés)
        getFinalScore(cycle.id, c.id), // null enquanto aberto p/ não-admin
      ]);
      return { contractor: c, mine: !!mine, selfVisible: !!self, finalScore: score?.final_score ?? null };
    }),
  );

  // TODO(ui): recriar ClientHistory (seletor de ciclo + tabela; abrir ReviewDetail).
  return <pre>{JSON.stringify({ cycle: cycle.label, status: cycle.status, rows: rows.map((r) => ({ name: r.contractor.full_name, score: r.finalScore })) }, null, 2)}</pre>;
}
