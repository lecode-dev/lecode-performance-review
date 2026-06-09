// =============================================================================
// stores/reviewDraft.ts · Zustand — rascunho do formulário em edição (UI efêmera).
// NÃO guarda autoridade; o envio vai por Server Action → RPC (sob RLS).
// =============================================================================

import { create } from 'zustand';
import type { ReviewComments } from '@/lib/database.types';

interface DraftState {
  answers: Record<string, number>; // question_id -> 1..5
  comments: ReviewComments;
  dirty: boolean;
  setAnswer: (questionId: string, score: number) => void;
  setComment: (key: keyof ReviewComments, value: string) => void;
  /** Preenche ao reabrir uma avaliação já enviada (editar enquanto aberto). */
  hydrate: (data: { answers: Record<string, number>; comments?: ReviewComments }) => void;
  reset: () => void;
  /** Quantas das 25 perguntas foram respondidas. */
  answeredCount: () => number;
}

const EMPTY_COMMENTS: ReviewComments = { strengths: '', growth: '', extra: '' };

export const useReviewDraft = create<DraftState>((set, get) => ({
  answers: {},
  comments: { ...EMPTY_COMMENTS },
  dirty: false,
  setAnswer: (questionId, score) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: score }, dirty: true })),
  setComment: (key, value) =>
    set((s) => ({ comments: { ...s.comments, [key]: value }, dirty: true })),
  hydrate: (data) =>
    set({ answers: { ...data.answers }, comments: { ...EMPTY_COMMENTS, ...(data.comments ?? {}) }, dirty: false }),
  reset: () => set({ answers: {}, comments: { ...EMPTY_COMMENTS }, dirty: false }),
  answeredCount: () => Object.keys(get().answers).length,
}));
