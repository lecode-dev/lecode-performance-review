// =============================================================================
// lib/data/reviews.ts · leitura e escrita de avaliações.
// As regras anti-viés NÃO estão aqui — estão na RLS. Estes helpers apenas
// consultam; o banco devolve só o que o usuário pode ver.
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import type { Database, ReviewType, ReviewComments } from '@/lib/database.types';

type Review = Database['public']['Tables']['reviews']['Row'];

export interface ReviewWithAnswers extends Review {
  answers: Record<string, number>; // question_id -> score
}

/** Uma review específica (self|client) com respostas. Retorna null se a RLS ocultar. */
export async function getReview(
  cycleId: string,
  contractorId: string,
  type: ReviewType,
): Promise<ReviewWithAnswers | null> {
  const supabase = await createClient();
  const { data: review } = await supabase
    .from('reviews')
    .select('*')
    .eq('cycle_id', cycleId)
    .eq('contractor_id', contractorId)
    .eq('type', type)
    .maybeSingle();
  if (!review) return null;

  const { data: rows } = await supabase
    .from('review_answers')
    .select('question_id, score')
    .eq('review_id', review.id);

  const answers: Record<string, number> = {};
  for (const r of rows ?? []) answers[r.question_id] = r.score;
  return { ...review, answers };
}

/** Médias por dimensão de uma review (via view; respeita RLS). */
export async function getDimensionScores(cycleId: string, contractorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('review_dimension_scores')
    .select('type, dimension, dim_score')
    .eq('cycle_id', cycleId)
    .eq('contractor_id', contractorId);
  return data ?? [];
}

/**
 * Envia (ou re-envia, enquanto o ciclo está aberto) uma avaliação completa.
 * Chama o RPC submit_review (upsert + respostas). A RLS autoriza/bloqueia.
 */
export async function submitReview(params: {
  cycleId: string;
  contractorId: string;
  type: ReviewType;
  answers: Record<string, number>; // question_id -> 1..5
  comments?: ReviewComments;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('submit_review', {
    p_cycle: params.cycleId,
    p_contractor: params.contractorId,
    p_type: params.type,
    p_answers: params.answers,
    p_comments: params.comments ?? {},
  });
  if (error) throw error; // ex.: violação de RLS se ciclo fechado / sem vínculo
  return data as string;
}

/** Score final consolidado via RPC (só admin ou ciclo encerrado). */
export async function getFinalScore(cycleId: string, contractorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_final_score', { p_cycle: cycleId, p_contractor: contractorId });
  if (error) {
    // 'score_indisponivel_ate_encerrar' é esperado antes do encerramento (não-admin)
    if (error.message.includes('score_indisponivel')) return null;
    throw error;
  }
  return data?.[0] ?? null; // { self_score, client_score, final_score }
}
