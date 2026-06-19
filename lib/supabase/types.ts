export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole     = 'lecode_admin' | 'client_rep' | 'contractor'
export type CycleStatus  = 'open' | 'closed'
export type ReviewType   = 'self' | 'client'
export type ReviewStatus = 'draft' | 'submitted'
export type DimensionKey = 'tech' | 'delivery' | 'comm' | 'collab' | 'autonomy'

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  tech:      'Técnica',
  delivery:  'Entrega',
  comm:      'Comunicação',
  collab:    'Colaboração',
  autonomy:  'Autonomia',
}

// @supabase/supabase-js v2 requires Relationships on every table + Returns must not be void
export interface Database {
  public: {
    Tables: {
      clients: {
        Row:           { id: string; name: string; slug: string; industry: string | null; color: string | null; created_at: string }
        Insert:        { id?: string; name: string; slug: string; industry?: string | null; color?: string | null }
        Update:        { name?: string; slug?: string; industry?: string | null; color?: string | null }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string; role: UserRole; full_name: string; email: string
          client_id: string | null; created_at: string; updated_at: string
        }
        Insert: { id: string; role?: UserRole; full_name: string; email: string; client_id?: string | null }
        Update: { role?: UserRole; full_name?: string; email?: string; client_id?: string | null }
        Relationships: [
          { foreignKeyName: 'profiles_id_fkey'; columns: ['id']; isOneToOne: true; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      contractors: {
        Row:    { id: string; github_handle: string | null; skills: string[] | null; seniority: string; track: string; since: string | null; created_at: string }
        Insert: { id: string; github_handle?: string | null; skills?: string[] | null; seniority?: string; track?: string; since?: string | null }
        Update: { github_handle?: string | null; skills?: string[] | null; seniority?: string; track?: string; since?: string | null }
        Relationships: [
          { foreignKeyName: 'contractors_id_fkey'; columns: ['id']; isOneToOne: true; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      allocations: {
        Row: {
          id: string; contractor_id: string; client_id: string
          started_on: string; ended_on: string | null; created_at: string
        }
        Insert: { id?: string; contractor_id: string; client_id: string; started_on: string; ended_on?: string | null }
        Update: { ended_on?: string | null }
        Relationships: [
          { foreignKeyName: 'allocations_contractor_id_fkey'; columns: ['contractor_id']; isOneToOne: false; referencedRelation: 'contractors'; referencedColumns: ['id'] },
          { foreignKeyName: 'allocations_client_id_fkey';     columns: ['client_id'];     isOneToOne: false; referencedRelation: 'clients';     referencedColumns: ['id'] }
        ]
      }
      cycles: {
        Row: {
          id: string; name: string; status: CycleStatus
          opens_at: string; closes_at: string; created_at: string; closed_at: string | null
        }
        Insert: { id?: string; name: string; status?: CycleStatus; opens_at: string; closes_at: string }
        Update: { name?: string; status?: CycleStatus; closes_at?: string; closed_at?: string | null }
        Relationships: []
      }
      form_versions: {
        Row:    { id: string; cycle_id: string; self_weight: number; client_weight: number; created_at: string }
        Insert: { id?: string; cycle_id: string; self_weight?: number; client_weight?: number }
        Update: { self_weight?: number; client_weight?: number }
        Relationships: [
          { foreignKeyName: 'form_versions_cycle_id_fkey'; columns: ['cycle_id']; isOneToOne: false; referencedRelation: 'cycles'; referencedColumns: ['id'] }
        ]
      }
      form_questions: {
        Row: {
          id: string; form_version_id: string; dimension: DimensionKey
          text: string; order_index: number; applies_to: ReviewType; created_at: string
        }
        Insert: { id?: string; form_version_id: string; dimension: DimensionKey; text: string; order_index: number; applies_to: ReviewType }
        Update: { text?: string; order_index?: number }
        Relationships: [
          { foreignKeyName: 'form_questions_form_version_id_fkey'; columns: ['form_version_id']; isOneToOne: false; referencedRelation: 'form_versions'; referencedColumns: ['id'] }
        ]
      }
      reviews: {
        Row: {
          id: string; cycle_id: string; contractor_id: string; type: ReviewType
          author_id: string; status: ReviewStatus; strengths: string | null
          growth: string | null; extra: string | null
          created_at: string; updated_at: string; submitted_at: string | null
        }
        Insert: {
          id?: string; cycle_id: string; contractor_id: string; type: ReviewType
          author_id: string; status?: ReviewStatus; strengths?: string | null
          growth?: string | null; extra?: string | null
        }
        Update: {
          status?: ReviewStatus; strengths?: string | null
          growth?: string | null; extra?: string | null; submitted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'reviews_cycle_id_fkey';      columns: ['cycle_id'];      isOneToOne: false; referencedRelation: 'cycles';      referencedColumns: ['id'] },
          { foreignKeyName: 'reviews_contractor_id_fkey'; columns: ['contractor_id']; isOneToOne: false; referencedRelation: 'contractors'; referencedColumns: ['id'] },
          { foreignKeyName: 'reviews_author_id_fkey';     columns: ['author_id'];     isOneToOne: false; referencedRelation: 'profiles';    referencedColumns: ['id'] }
        ]
      }
      review_answers: {
        Row:    { id: string; review_id: string; question_id: string; score: number; created_at: string; updated_at: string }
        Insert: { id?: string; review_id: string; question_id: string; score: number }
        Update: { score?: number }
        Relationships: [
          { foreignKeyName: 'review_answers_review_id_fkey';   columns: ['review_id'];   isOneToOne: false; referencedRelation: 'reviews';        referencedColumns: ['id'] },
          { foreignKeyName: 'review_answers_question_id_fkey'; columns: ['question_id']; isOneToOne: false; referencedRelation: 'form_questions'; referencedColumns: ['id'] }
        ]
      }
      contractor_changelog: {
        Row: {
          id: string; contractor_id: string; field: string
          old_value: string | null; new_value: string | null; note: string | null
          changed_by: string | null; changed_at: string; created_at: string
        }
        Insert: {
          id?: string; contractor_id: string; field: string
          old_value?: string | null; new_value?: string | null; note?: string | null
          changed_by?: string | null; changed_at?: string
        }
        Update: {
          old_value?: string | null; new_value?: string | null; note?: string | null
        }
        Relationships: [
          { foreignKeyName: 'contractor_changelog_contractor_id_fkey'; columns: ['contractor_id']; isOneToOne: false; referencedRelation: 'contractors'; referencedColumns: ['id'] }
        ]
      }
      contractor_history: {
        Row: {
          id: string; cycle_id: string; contractor_id: string
          self_avg: number | null; client_avg: number | null; final_score: number | null
          self_weight: number | null; client_weight: number | null; snapshot: Json | null; created_at: string
        }
        Insert: {
          id?: string; cycle_id: string; contractor_id: string
          self_avg?: number | null; client_avg?: number | null; final_score?: number | null
          self_weight?: number | null; client_weight?: number | null; snapshot?: Json | null
        }
        Update: {
          self_avg?: number | null; client_avg?: number | null
          final_score?: number | null; snapshot?: Json | null
        }
        Relationships: [
          { foreignKeyName: 'contractor_history_cycle_id_fkey';      columns: ['cycle_id'];      isOneToOne: false; referencedRelation: 'cycles';      referencedColumns: ['id'] },
          { foreignKeyName: 'contractor_history_contractor_id_fkey'; columns: ['contractor_id']; isOneToOne: false; referencedRelation: 'contractors'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: {
      final_scores: {
        Row: {
          cycle_id: string; contractor_id: string
          self_weight: number; client_weight: number
          self_avg: number | null; client_avg: number | null; final_score: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      close_cycle:     { Args: { p_cycle: string };                       Returns: undefined }
      get_final_score: { Args: { p_cycle: string; p_contractor: string }; Returns: { self_avg: number; client_avg: number; final_score: number; self_weight: number; client_weight: number }[] }
      submit_review:   { Args: { p_review: string };                      Returns: undefined }
      auth_role:       { Args: Record<string, never>;                     Returns: UserRole }
    }
    Enums: {
      user_role:     UserRole
      cycle_status:  CycleStatus
      review_type:   ReviewType
      review_status: ReviewStatus
      dimension_key: DimensionKey
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
