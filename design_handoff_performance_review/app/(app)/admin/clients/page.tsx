// =============================================================================
// app/(app)/admin/clients/page.tsx · Clientes.
// =============================================================================

import { createClient } from '@/lib/supabase/server';

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('*, allocations:allocations(count)')
    .order('name');

  // TODO(ui): recriar AdminClients (cards de cliente + "Novo cliente").
  return <pre>{JSON.stringify(clients, null, 2)}</pre>;
}
