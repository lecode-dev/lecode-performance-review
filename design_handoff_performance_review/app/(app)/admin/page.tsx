// =============================================================================
// app/(app)/admin/page.tsx · Visão geral do Gestor.
// Data-fetching pronto; substitua o bloco JSX pela UI (recriar design/screens-admin.jsx → AdminDashboard).
// =============================================================================

import { getActiveCycle, getCycleProgress, listCycles } from '@/lib/data/cycles';
import { listContractors } from '@/lib/data/contractors';
import { getFinalScore } from '@/lib/data/reviews';

export default async function AdminDashboardPage() {
  const [cycles, active, contractors] = await Promise.all([
    listCycles(),
    getActiveCycle(),
    listContractors(),
  ]);
  const progress = active ? await getCycleProgress(active.id) : null;

  // Decisões do último ciclo encerrado (badge de recomendação por contratado)
  const lastClosed = cycles.find((c) => c.status === 'closed') ?? null;
  const decisions = lastClosed
    ? await Promise.all(
        contractors.map(async (c) => ({
          contractor: c,
          score: (await getFinalScore(lastClosed.id, c.id))?.final_score ?? null,
        })),
      )
    : [];

  // TODO(ui): recriar AdminDashboard (design/screens-admin.jsx) com Tailwind.
  return (
    <pre>
      {JSON.stringify(
        { active, progress, contractors: contractors.length, lastClosed: lastClosed?.label, decisions: decisions.length },
        null,
        2,
      )}
    </pre>
  );
}
