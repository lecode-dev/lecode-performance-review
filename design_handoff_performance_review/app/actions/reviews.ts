// =============================================================================
// app/actions/reviews.ts · Server Actions para mutações vindas de Client Components.
// Mantêm a escrita no servidor (sob RLS) e revalidam as rotas afetadas.
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { submitReview as submitReviewData } from '@/lib/data/reviews';
import { closeCycle as closeCycleData, openCycle as openCycleData } from '@/lib/data/cycles';
import type { ReviewType, ReviewComments } from '@/lib/database.types';

export async function submitReviewAction(input: {
  cycleId: string;
  contractorId: string;
  type: ReviewType;
  answers: Record<string, number>;
  comments?: ReviewComments;
}) {
  try {
    const id = await submitReviewData(input);
    revalidatePath('/contractor');
    revalidatePath('/client/team');
    revalidatePath('/admin/contractors');
    return { ok: true as const, id };
  } catch (e: any) {
    return { ok: false as const, error: mapError(e?.message) };
  }
}

export async function closeCycleAction(cycleId: string) {
  try {
    await closeCycleData(cycleId);
    revalidatePath('/admin/cycles');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: mapError(e?.message) };
  }
}

export async function openCycleAction(month: string) {
  try {
    const id = await openCycleData(month);
    revalidatePath('/admin/cycles');
    return { ok: true as const, id };
  } catch (e: any) {
    return { ok: false as const, error: mapError(e?.message) };
  }
}

/** Traduz códigos de erro do Postgres/RPC para mensagens de UI (já há PT/EN/ES no i18n). */
function mapError(msg?: string): string {
  if (!msg) return 'erro_desconhecido';
  if (msg.includes('avaliacoes_pendentes')) return 'avaliacoes_pendentes';
  if (msg.includes('ja_existe_ciclo_aberto')) return 'ja_existe_ciclo_aberto';
  if (msg.includes('score_indisponivel')) return 'score_indisponivel';
  if (msg.toLowerCase().includes('row-level security') || msg.includes('forbidden')) return 'sem_permissao';
  return msg;
}
