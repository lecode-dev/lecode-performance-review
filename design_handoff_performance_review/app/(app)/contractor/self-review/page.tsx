// =============================================================================
// app/(app)/contractor/self-review/page.tsx · Autoavaliação (editar enquanto aberto).
// =============================================================================

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getActiveCycle } from '@/lib/data/cycles';
import { getActiveForm, listContractors } from '@/lib/data/contractors';
import { getReview } from '@/lib/data/reviews';
import { EvaluationForm } from '@/components/evaluation-form'; // recriar de design/shared.jsx

export default async function SelfReviewPage() {
  const session = await requireRole('contractor');
  const cycle = await getActiveCycle();
  if (!cycle || !session.contractorId) redirect('/contractor');

  const [form, existing, me] = await Promise.all([
    getActiveForm(),
    getReview(cycle.id, session.contractorId, 'self'),
    listContractors().then((cs) => cs.find((c) => c.id === session.contractorId)),
  ]);

  // TODO(ui): <EvaluationForm type="self" existing={existing} .../> com double-check.
  // Botão muda para "Salvar alterações" se existing?.status === 'submitted'.
  return (
    <EvaluationForm
      type="self"
      cycle={cycle}
      contractor={me}
      form={form}
      existing={existing}
    />
  );
}
