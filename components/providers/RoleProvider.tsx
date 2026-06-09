'use client'
import { createContext, useContext } from 'react'
import type { UserRole } from '@/lib/supabase/types'

const RoleContext = createContext<UserRole | null>(null)

export function RoleProvider({
  role,
  children,
}: {
  role: UserRole
  children: React.ReactNode
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useRole(): UserRole {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used inside RoleProvider')
  return ctx
}
