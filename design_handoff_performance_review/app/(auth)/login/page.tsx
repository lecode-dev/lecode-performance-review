// =============================================================================
// app/(auth)/login/page.tsx · Login. Recriar a UI de design/auth.jsx (LoginScreen).
// O perfil NÃO é escolhido aqui — vem de profiles.role após autenticar.
// =============================================================================

import { redirect } from 'next/navigation';
import { getSessionProfile, HOME_BY_ROLE } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form'; // client component (recriar de design/auth.jsx)

export default async function LoginPage() {
  const session = await getSessionProfile();
  if (session) redirect(HOME_BY_ROLE[session.role]); // já logado → home do perfil

  // TODO(ui): recriar LoginScreen (split layout, terminal, validação, PT/EN/ES).
  // O LoginForm chama supabase.auth.signInWithPassword; após sucesso, o middleware
  // e o redirect por role assumem. Sem seletor de perfil.
  return <LoginForm />;
}
