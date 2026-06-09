'use client'
import { create } from 'zustand'

type Score = 1 | 2 | 3 | 4 | 5

interface Comments {
  strengths: string
  growth:    string
  extra:     string
}

interface ReviewDraftState {
  reviewId:   string | null
  answers:    Record<string, Score>
  comments:   Comments
  isDirty:    boolean
  isSaving:   boolean
  setReviewId:  (id: string) => void
  setAnswer:    (questionId: string, score: Score) => void
  setComment:   (key: keyof Comments, value: string) => void
  loadDraft:    (answers: Record<string, Score>, comments: Comments) => void
  markSaving:   (v: boolean) => void
  markClean:    () => void
  reset:        () => void
}

const EMPTY_COMMENTS: Comments = { strengths: '', growth: '', extra: '' }

export const useReviewDraft = create<ReviewDraftState>((set) => ({
  reviewId:  null,
  answers:   {},
  comments:  EMPTY_COMMENTS,
  isDirty:   false,
  isSaving:  false,

  setReviewId:  (id) => set({ reviewId: id }),

  setAnswer: (questionId, score) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: score }, isDirty: true })),

  setComment: (key, value) =>
    set((s) => ({ comments: { ...s.comments, [key]: value }, isDirty: true })),

  loadDraft: (answers, comments) =>
    set({ answers, comments, isDirty: false }),

  markSaving: (v) => set({ isSaving: v }),
  markClean:  () => set({ isDirty: false }),

  reset: () => set({ reviewId: null, answers: {}, comments: EMPTY_COMMENTS, isDirty: false, isSaving: false }),
}))
