// =============================================================================
// app/(auth)/signup/page.tsx · Cadastro. Novos usuários entram como 'contractor'
// (trigger handle_new_user). O perfil elevado é atribuído por admin depois.
// =============================================================================

import { redirect } from 'next/navigation';
import { getSessionProfile, HOME_BY_ROLE } from '@/lib/auth';
import { SignupForm } from '@/components/auth/signup-form'; // recriar de design/auth.jsx

export default async function SignupPage() {
  const session = await getSessionProfile();
  if (session) redirect(HOME_BY_ROLE[session.role]);

  // TODO(ui): recriar SignupScreen — "Perfil inicial: Contratado" (read-only).
  return <SignupForm />;
}
