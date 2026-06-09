// =============================================================================
// app/(app)/admin/form/page.tsx · Editor do formulário de avaliação.
// =============================================================================

import { getActiveForm } from '@/lib/data/contractors';

export default async function AdminFormPage() {
  const form = await getActiveForm();

  // TODO(ui): recriar AdminFormEditor (pesos + escala + perguntas por dimensão).
  // Edições de perguntas/pesos → nova form_version (não mutar versões passadas).
  return <pre>{JSON.stringify({ version: form.version, dimensions: Object.keys(form.questionsByDimension) }, null, 2)}</pre>;
}
