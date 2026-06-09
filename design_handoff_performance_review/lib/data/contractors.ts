// =============================================================================
// lib/data/contractors.ts · contratados, equipe do cliente, alocações, formulário.
// Sob RLS: admin vê todos; client_rep vê os alocados no seu cliente; contractor o próprio.
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import type { Database, DimensionKey } from '@/lib/database.types';

type Contractor = Database['public']['Tables']['contractors']['Row'];

export interface ContractorView extends Contractor {
  full_name: string;
  email: string;
  client_id: string | null;
  client_name: string | null;
}

/** Lista de contratados visíveis ao usuário corrente (RLS decide o conjunto). */
export async function listContractors(): Promise<ContractorView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contractors')
    .select(`
      *,
      profile:profiles!contractors_profile_id_fkey ( full_name, email ),
      allocation:allocations!allocations_contractor_id_fkey ( client_id, ended_on, client:clients ( name ) )
    `);
  if (error) throw error;

  return (data ?? []).map((c: any) => {
    const active = (c.allocation ?? []).find((a: any) => a.ended_on === null);
    return {
      ...c,
      full_name: c.profile?.full_name ?? '',
      email: c.profile?.email ?? '',
      client_id: active?.client_id ?? null,
      client_name: active?.client?.name ?? null,
    };
  });
}

/** Equipe alocada no cliente do representante (atalho). */
export async function listMyTeam(): Promise<ContractorView[]> {
  // A RLS já restringe; listContractors() devolve apenas os alocados ao client_rep.
  return listContractors();
}

/** Perguntas do formulário ativo, agrupadas por dimensão e ordenadas. */
export async function getActiveForm(): Promise<{
  version: { id: string; self_weight: number; client_weight: number };
  questionsByDimension: Record<DimensionKey, { id: string; position: number; text: string }[]>;
}> {
  const supabase = await createClient();
  const { data: version, error: vErr } = await supabase
    .from('form_versions')
    .select('id, self_weight, client_weight')
    .eq('is_active', true)
    .single();
  if (vErr) throw vErr;

  const { data: questions, error: qErr } = await supabase
    .from('form_questions')
    .select('id, dimension, position, text')
    .eq('form_version_id', version.id)
    .order('position');
  if (qErr) throw qErr;

  const byDim = {} as Record<DimensionKey, { id: string; position: number; text: string }[]>;
  for (const q of questions ?? []) {
    (byDim[q.dimension] ??= []).push({ id: q.id, position: q.position, text: q.text });
  }
  return { version, questionsByDimension: byDim };
}

// ---- Ações admin ----

/**
 * Atualiza dados do contratado (cargo / senioridade / trilha).
 * O histórico é gravado AUTOMATICAMENTE pelo trigger contractors_audit (0002) —
 * não inserir em contractor_history manualmente.
 */
export async function updateContractor(
  contractorId: string,
  data: Partial<{ role_title: string; seniority: string; track: string }>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('contractors').update(data).eq('id', contractorId);
  if (error) throw error; // RLS: só lecode_admin
}

/**
 * Cadastra um novo contratado. Fluxo real (2 passos), pois o nome/e-mail vivem
 * em profiles (auth.users):
 *   1. convidar o usuário (Supabase Auth admin / inviteUserByEmail) → cria auth.users + profile (role 'contractor');
 *   2. inserir a linha em contractors com profile_id e, opcionalmente, allocations.
 * Aqui só o passo 2 (assumindo profileId já existente). O passo 1 é server-only (service role).
 */
export async function createContractor(input: {
  profileId: string; roleTitle: string; track: string; seniority: string; clientId?: string | null;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contractors')
    .insert({ profile_id: input.profileId, role_title: input.roleTitle, track: input.track, seniority: input.seniority })
    .select('id')
    .single();
  if (error) throw error;
  if (input.clientId) await setAllocation(data.id, input.clientId);
  return data.id;
}

export async function setAllocation(contractorId: string, clientId: string | null): Promise<void> {
  const supabase = await createClient();
  // encerra vínculo ativo
  await supabase.from('allocations').update({ ended_on: new Date().toISOString().slice(0, 10) })
    .eq('contractor_id', contractorId).is('ended_on', null);
  // cria novo vínculo, se houver cliente
  if (clientId) {
    const { error } = await supabase.from('allocations').insert({ contractor_id: contractorId, client_id: clientId });
    if (error) throw error;
  }
}

export async function assignRole(userId: string, role: 'lecode_admin' | 'client_rep' | 'contractor', clientId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('assign_role', { p_user: userId, p_role: role, p_client: clientId ?? null });
  if (error) throw error;
}

/** Histórico de alterações (auditoria) de um contratado. RLS filtra o acesso. */
export async function listContractorHistory(contractorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contractor_history')
    .select('id, field, old_value, new_value, note, changed_at, changed_by')
    .eq('contractor_id', contractorId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
