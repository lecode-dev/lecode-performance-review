// =============================================================================
// app/(app)/admin/cycles/page.tsx · Ciclos de avaliação (abrir/encerrar via Server Actions).
// =============================================================================

import { listCycles, getCycleProgress } from '@/lib/data/cycles';
// import { openCycleAction, closeCycleAction } from '@/app/actions/reviews';
// As ações ficam em componentes client (botões) com useTransition + double-check.

export default async function AdminCyclesPage() {
  const cycles = await listCycles();
  const withProgress = await Promise.all(
    cycles.map(async (c) => ({ cycle: c, progress: await getCycleProgress(c.id) })),
  );

  // TODO(ui): recriar AdminCycles (design/screens-admin.jsx).
  // - Botão "Abrir ciclo" → openCycleAction (desabilitado se já houver aberto).
  // - Botão "Encerrar ciclo" → confirm (danger) → closeCycleAction.
  //   Tratar erro 'avaliacoes_pendentes'.
  return <pre>{JSON.stringify(withProgress.map((w) => ({ label: w.cycle.label, status: w.cycle.status, ...w.progress })), null, 2)}</pre>;
}
