// =============================================================================
// lib/database.types.ts · LeCode Performance Review
// Tipos do schema (espelham supabase/migrations/0001_schema.sql).
// Em produção, gere com: `supabase gen types typescript --linked > lib/database.types.ts`
// e descarte este arquivo. Mantido aqui como referência/arranque.
// =============================================================================

export type UserRole = 'lecode_admin' | 'client_rep' | 'contractor';
export type CycleStatus = 'open' | 'closed';
export type ReviewType = 'self' | 'client';
export type ReviewStatus = 'draft' | 'submitted';
export type DimensionKey = 'tech' | 'delivery' | 'comm' | 'collab' | 'autonomy';

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: { id: string; name: string; industry: string | null; created_at: string };
        Insert: { id?: string; name: string; industry?: string | null };
        Update: Partial<{ name: string; industry: string | null }>;
      };
      profiles: {
        Row: { id: string; full_name: string; email: string; role: UserRole; client_id: string | null; created_at: string };
        Insert: { id: string; full_name: string; email: string; role?: UserRole; client_id?: string | null };
        Update: Partial<{ full_name: string; email: string; role: UserRole; client_id: string | null }>;
      };
      contractors: {
        Row: { id: string; profile_id: string; role_title: string; track: string; seniority: string; started_on: string };
        Insert: { id?: string; profile_id: string; role_title: string; track: string; seniority: string; started_on?: string };
        Update: Partial<{ role_title: string; track: string; seniority: string }>;
      };
      allocations: {
        Row: { id: string; contractor_id: string; client_id: string; started_on: string; ended_on: string | null };
        Insert: { id?: string; contractor_id: string; client_id: string; started_on?: string; ended_on?: string | null };
        Update: Partial<{ ended_on: string | null }>;
      };
      cycles: {
        Row: { id: string; label: string; starts_on: string; submit_ends_on: string; ends_on: string; status: CycleStatus; closed_at: string | null; created_by: string | null; created_at: string };
        Insert: { id?: string; label: string; starts_on: string; submit_ends_on: string; ends_on: string; status?: CycleStatus };
        Update: Partial<{ label: string; starts_on: string; submit_ends_on: string; ends_on: string; status: CycleStatus; closed_at: string | null }>;
      };
      form_versions: {
        Row: { id: string; version: number; self_weight: number; client_weight: number; is_active: boolean; created_at: string };
        Insert: { id?: string; version: number; self_weight?: number; client_weight?: number; is_active?: boolean };
        Update: Partial<{ self_weight: number; client_weight: number; is_active: boolean }>;
      };
      form_questions: {
        Row: { id: string; form_version_id: string; dimension: DimensionKey; position: number; text: string };
        Insert: { id?: string; form_version_id: string; dimension: DimensionKey; position: number; text: string };
        Update: Partial<{ dimension: DimensionKey; position: number; text: string }>;
      };
      reviews: {
        Row: { id: string; cycle_id: string; contractor_id: string; type: ReviewType; author_id: string; status: ReviewStatus; comments: ReviewComments; submitted_at: string | null; updated_at: string };
        Insert: { id?: string; cycle_id: string; contractor_id: string; type: ReviewType; author_id: string; status?: ReviewStatus; comments?: ReviewComments };
        Update: Partial<{ status: ReviewStatus; comments: ReviewComments; submitted_at: string | null }>;
      };
      review_answers: {
        Row: { review_id: string; question_id: string; score: number };
        Insert: { review_id: string; question_id: string; score: number };
        Update: Partial<{ score: number }>;
      };
      contractor_history: {
        Row: { id: string; contractor_id: string; field: 'role' | 'seniority' | 'track' | 'allocation'; old_value: string | null; new_value: string | null; note: string | null; changed_by: string | null; changed_at: string };
        Insert: { contractor_id: string; field: string; old_value?: string | null; new_value?: string | null; note?: string | null; changed_by?: string | null };
        Update: never;
      };
    };
    Views: {
      review_dimension_scores: {
        Row: { cycle_id: string; contractor_id: string; type: ReviewType; dimension: DimensionKey; dim_score: number };
      };
      final_scores: {
        Row: { cycle_id: string; contractor_id: string; self_score: number | null; client_score: number | null; final_score: number };
      };
    };
    Functions: {
      open_cycle: { Args: { p_month: string }; Returns: string };
      close_cycle: { Args: { p_cycle: string }; Returns: void };
      submit_review: { Args: { p_cycle: string; p_contractor: string; p_type: ReviewType; p_answers: Record<string, number>; p_comments?: ReviewComments }; Returns: string };
      get_final_score: { Args: { p_cycle: string; p_contractor: string }; Returns: { self_score: number; client_score: number; final_score: number }[] };
      assign_role: { Args: { p_user: string; p_role: UserRole; p_client?: string | null }; Returns: void };
    };
  };
}

export interface ReviewComments {
  strengths?: string;
  growth?: string;
  extra?: string;
}
