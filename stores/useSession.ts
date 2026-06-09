'use client'
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/types'

interface SessionState {
  user:     User | null
  role:     UserRole | null
  fullName: string | null
  setSession:   (user: User, role: UserRole, fullName: string) => void
  clearSession: () => void
}

export const useSession = create<SessionState>((set) => ({
  user:     null,
  role:     null,
  fullName: null,
  setSession:   (user, role, fullName) => set({ user, role, fullName }),
  clearSession: () => set({ user: null, role: null, fullName: null }),
}))
