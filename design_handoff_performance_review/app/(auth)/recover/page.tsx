// =============================================================================
// app/(auth)/recover/page.tsx · Recuperação de senha (envia link de reset).
// =============================================================================

import { RecoverForm } from '@/components/auth/recover-form'; // recriar de design/auth.jsx

export default function RecoverPage() {
  // TODO(ui): recriar RecoverScreen (form → supabase.auth.resetPasswordForEmail → tela de confirmação).
  return <RecoverForm />;
}
