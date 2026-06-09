// =============================================================================
// app/(app)/contractor/layout.tsx · guard do Contratado LeCode.
// =============================================================================

import { requireRole } from '@/lib/auth';

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  await requireRole('contractor');
  return <>{children}</>;
}
