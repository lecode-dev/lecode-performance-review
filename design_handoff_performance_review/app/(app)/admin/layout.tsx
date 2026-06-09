// =============================================================================
// app/(app)/admin/layout.tsx · guard do Gestor LeCode.
// =============================================================================

import { requireRole } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('lecode_admin'); // redireciona p/ home do perfil se não for admin
  return <>{children}</>;
}
