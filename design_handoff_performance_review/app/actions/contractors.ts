// =============================================================================
// app/actions/contractors.ts · Server Actions de cadastro/edição de contratados.
// Mutações sob RLS (só lecode_admin). O histórico é gravado por trigger no banco.
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import {
  updateContractor as updateContractorData,
  setAllocation as setAllocationData,
  createContractor as createContractorData,
} from '@/lib/data/contractors';

export async function updateContractorAction(
  contractorId: string,
  data: Partial<{ role_title: string; seniority: string; track: string }>,
) {
  try {
    await updateContractorData(contractorId, data);
    revalidatePath(`/admin/contractors/${contractorId}`);
    revalidatePath('/admin/contractors');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'erro_desconhecido' };
  }
}

export async function setAllocationAction(contractorId: string, clientId: string | null) {
  try {
    await setAllocationData(contractorId, clientId);
    revalidatePath(`/admin/contractors/${contractorId}`);
    revalidatePath('/admin/contractors');
    revalidatePath('/client/team');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'erro_desconhecido' };
  }
}

export async function createContractorAction(input: {
  profileId: string; roleTitle: string; track: string; seniority: string; clientId?: string | null;
}) {
  try {
    const id = await createContractorData(input);
    revalidatePath('/admin/contractors');
    return { ok: true as const, id };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'erro_desconhecido' };
  }
}
