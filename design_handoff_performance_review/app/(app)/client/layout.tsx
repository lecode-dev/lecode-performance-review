// =============================================================================
// app/(app)/client/layout.tsx · guard do Representante Cliente.
// =============================================================================

import { requireRole } from '@/lib/auth';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireRole('client_rep');
  return <>{children}</>;
}
