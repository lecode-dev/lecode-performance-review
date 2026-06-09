// =============================================================================
// lib/auth.ts · sessão + perfil no servidor. A role vem do BANCO, não do JWT.
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/database.types';

export interface SessionProfile {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  clientId: string | null;
  contractorId: string | null;
}

/** Lê o usuário autenticado e o profile (role autoritativa do banco). */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, client_id')
    .eq('id', user.id)
    .single();
  if (!profile) return null;

  let contractorId: string | null = null;
  if (profile.role === 'contractor') {
    const { data: c } = await supabase.from('contractors').select('id').eq('profile_id', user.id).maybeSingle();
    contractorId = c?.id ?? null;
  }

  return {
    userId: user.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
    clientId: profile.client_id,
    contractorId,
  };
}

/** Exige sessão; redireciona para /login se não houver. */
export async function requireSession(): Promise<SessionProfile> {
  const s = await getSessionProfile();
  if (!s) redirect('/login');
  return s;
}

/** Exige uma role específica; redireciona para a home do perfil se não bater. */
export async function requireRole(role: UserRole): Promise<SessionProfile> {
  const s = await requireSession();
  if (s.role !== role) redirect(HOME_BY_ROLE[s.role]);
  return s;
}

export const HOME_BY_ROLE: Record<UserRole, string> = {
  lecode_admin: '/admin',
  client_rep: '/client',
  contractor: '/contractor',
};
