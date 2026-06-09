// =============================================================================
// app/page.tsx · raiz → redireciona para o login ou para a home do perfil.
// =============================================================================

import { redirect } from 'next/navigation';
import { getSessionProfile, HOME_BY_ROLE } from '@/lib/auth';

export default async function RootPage() {
  const session = await getSessionProfile();
  redirect(session ? HOME_BY_ROLE[session.role] : '/login');
}
