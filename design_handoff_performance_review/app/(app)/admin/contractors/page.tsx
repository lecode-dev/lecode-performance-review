// =============================================================================
// app/(app)/admin/contractors/page.tsx · Lista de contratados.
// =============================================================================

import { listContractors } from '@/lib/data/contractors';
import { listCycles } from '@/lib/data/cycles';
import { getFinalScore } from '@/lib/data/reviews';

export default async function AdminContractorsPage() {
  const [contractors, cycles] = await Promise.all([listContractors(), listCycles()]);
  const lastClosed = cycles.find((c) => c.status === 'closed') ?? null;

  const rows = await Promise.all(
    contractors.map(async (c) => ({
      contractor: c,
      lastScore: lastClosed ? (await getFinalScore(lastClosed.id, c.id))?.final_score ?? null : null,
    })),
  );

  // TODO(ui): recriar AdminContractors (tabela + busca + "Novo contratado").
  return <pre>{JSON.stringify(rows.map((r) => ({ name: r.contractor.full_name, client: r.contractor.client_name, lastScore: r.lastScore })), null, 2)}</pre>;
}
