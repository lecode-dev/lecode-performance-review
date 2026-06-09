// =============================================================================
// lib/data/cycles.ts · acesso a ciclos + ações admin (via RPC).
// Toda query roda sob RLS; os RPCs revalidam autorização no banco.
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type Cycle = Database['public']['Tables']['cycles']['Row'];

export async function listCycles(): Promise<Cycle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('cycles').select('*').order('starts_on', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActiveCycle(): Promise<Cycle | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('cycles').select('*').eq('status', 'open').maybeSingle();
  return data ?? null;
}

/** Progresso (concluídas/total) de um ciclo, opcionalmente filtrado por cliente. */
export async function getCycleProgress(cycleId: string, clientId?: string) {
  const supabase = await createClient();
  // contratados elegíveis = alocados no período (via allocations); simplificado p/ ativos:
  let q = supabase.from('allocations').select('contractor_id, client_id').is('ended_on', null);
  if (clientId) q = q.eq('client_id', clientId);
  const { data: allocs } = await q;
  const total = (allocs?.length ?? 0) * 2; // self + client

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, status, contractor_id')
    .eq('cycle_id', cycleId)
    .eq('status', 'submitted');
  const done = reviews?.length ?? 0;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// ---- Ações admin (RPC) ----
export async function openCycle(month: string): Promise<string> {
  // month: qualquer data do mês (YYYY-MM-01). O RPC deriva 1 / 15 / fim do mês.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('open_cycle', { p_month: month });
  if (error) throw error;
  return data as string;
}

export async function closeCycle(cycleId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('close_cycle', { p_cycle: cycleId });
  if (error) throw error; // 'avaliacoes_pendentes' | 'ciclo_nao_esta_aberto' | 'forbidden'
}
