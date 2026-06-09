// =============================================================================
// app/(app)/layout.tsx · shell autenticado. Valida sessão e injeta a role (do banco).
// =============================================================================

import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { AppShell } from '@/components/app-shell'; // recriar a partir de design/app.jsx

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile();
  if (!session) redirect('/login');

  // session.role vem de profiles.role (banco) — autoridade real.
  return <AppShell session={session}>{children}</AppShell>;
}
