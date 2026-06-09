// =============================================================================
// app/(app)/client/team/[contractorId]/evaluate/page.tsx · Avaliar um contratado.
// Pré-preenche a review existente (editar enquanto o ciclo está aberto).
// =============================================================================

import { redirect } from 'next/navigation';
import { getActiveCycle } from '@/lib/data/cycles';
import { getActiveForm, listMyTeam } from '@/lib/data/contractors';
import { getReview } from '@/lib/data/reviews';
import { EvaluationForm } from '@/components/evaluation-form'; // recriar de design/shared.jsx

export default async function ClientEvaluatePage({
  params,
}: {
  params: Promise<{ contractorId: string }>;
}) {
  const { contractorId } = await params;
  const cycle = await getActiveCycle();
  if (!cycle) redirect('/client/team'); // sem ciclo aberto, não há o que avaliar

  const [team, form, existing] = await Promise.all([
    listMyTeam(),
    getActiveForm(),
    getReview(cycle.id, contractorId, 'client'),
  ]);
  const contractor = team.find((c) => c.id === contractorId);
  if (!contractor) redirect('/client/team');

  // TODO(ui): <EvaluationForm type="client" .../> com double-check no envio.
  // Submit chama submitReviewAction({ cycleId, contractorId, type: 'client', answers, comments }).
  return (
    <EvaluationForm
      type="client"
      cycle={cycle}
      contractor={contractor}
      form={form}
      existing={existing}
    />
  );
}
