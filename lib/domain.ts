// =============================================================================
// lib/domain.ts · LeCode Performance Review
// Constantes de domínio + helpers de exibição (score, decisão, fases do ciclo).
// Funções puras sobre dados já buscados — o servidor é a fonte de verdade
// (views/RPC recalculam scores e fases reais; aqui é só para a UI).
// =============================================================================

import type { CycleStatus, DimensionKey } from './supabase/types'

export const DIMENSIONS: { key: DimensionKey; n: number; label: string; short: string; desc: string }[] = [
  { key: 'tech',     n: 1, label: 'Competência Técnica',    short: 'Técnica',     desc: 'Qualidade do código, conhecimento técnico, resolução de problemas.' },
  { key: 'delivery', n: 2, label: 'Entrega e Resultados',   short: 'Entrega',     desc: 'Cumprimento de prazos, qualidade das entregas, produtividade.' },
  { key: 'comm',     n: 3, label: 'Comunicação',            short: 'Comunicação', desc: 'Clareza, proatividade, feedback, documentação.' },
  { key: 'collab',   n: 4, label: 'Colaboração',            short: 'Colaboração', desc: 'Trabalho em equipe, apoio a colegas, atitude positiva.' },
  { key: 'autonomy', n: 5, label: 'Autonomia e Iniciativa', short: 'Autonomia',   desc: 'Proatividade, resolução independente, sugestões de melhoria.' },
]

export const SCALE = [
  { v: 1, label: 'Insatisfatório' },
  { v: 2, label: 'Abaixo do Esperado' },
  { v: 3, label: 'Atende Expectativas' },
  { v: 4, label: 'Acima do Esperado' },
  { v: 5, label: 'Excepcional' },
] as const

export const OPEN_QUESTIONS: { key: 'strengths' | 'growth' | 'extra'; label: string; hint: string }[] = [
  { key: 'strengths', label: 'Quais foram os principais pontos fortes?', hint: 'Descreva as principais qualidades e contribuições observadas no período.' },
  { key: 'growth',    label: 'Quais áreas precisam de desenvolvimento?', hint: 'Identifique oportunidades de melhoria e crescimento.' },
  { key: 'extra',     label: 'Feedback adicional ou sugestões?',         hint: 'Compartilhe observações adicionais ou recomendações.' },
]

export interface Decision { min: number; max: number; tier: 1 | 2 | 3 | 4 | 5; label: string; short: string; desc: string }

export const DECISIONS: Decision[] = [
  { min: 5.0, max: 5.01, tier: 5, label: 'Elegível para promoção vertical',              short: 'Promoção vertical',         desc: 'Desempenho excepcional. Avaliar mudança de cargo/nível.' },
  { min: 4.0, max: 5.0,  tier: 4, label: 'Elegível para promoção horizontal',            short: 'Promoção horizontal',       desc: 'Acima da média. Avaliar ajuste salarial / senioridade.' },
  { min: 3.0, max: 4.0,  tier: 3, label: 'Plano de desenvolvimento',                     short: 'Plano de desenvolvimento',  desc: 'Atende às expectativas. Definir PDI com metas de evolução.' },
  { min: 2.0, max: 3.0,  tier: 2, label: 'Plano de recuperação de 30 dias',              short: 'Recuperação 30 dias',       desc: 'Abaixo do esperado. Acompanhamento próximo por 30 dias.' },
  { min: 0,   max: 2.0,  tier: 1, label: 'Continuidade no projeto precisa ser avaliada', short: 'Avaliar continuidade',      desc: 'Insatisfatório. Revisar alocação e contrato.' },
]

/** Pesos default — os reais vivem em `form_versions` e o score final é calculado no servidor. */
export const SELF_WEIGHT = 0.3
export const CLIENT_WEIGHT = 0.7

export function decisionFor(score: number | null): Decision | null {
  if (score == null) return null
  return DECISIONS.find((d) => score >= d.min && score < d.max) ?? DECISIONS[DECISIONS.length - 1]
}

export function tierOf(v: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(v))) as 1 | 2 | 3 | 4 | 5
}

export function fmt(v: number | null): string {
  return v == null ? '—' : (Math.round(v * 100) / 100).toFixed(2)
}

/** Preview client-side do score final ponderado — apenas para exibição otimista; o servidor é a verdade. */
export function finalScore(self: number | null, client: number | null): number | null {
  if (self == null || client == null) return null
  return Math.round((self * SELF_WEIGHT + client * CLIENT_WEIGHT) * 100) / 100
}

/** Média das 25 respostas (5 por dimensão). */
export function overallFromAnswers(answers: Record<string, number>): number | null {
  const vals = Object.values(answers)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

// ---------------------------------------------------------------------------
// Fases do ciclo: Envio (dia 1–15) → Apuração e discussão (dia 15–fim do mês).
// `opens_at`/`closes_at` vêm de `cycles`; o "meio" é sempre o dia 15 do mês de abertura.
// ---------------------------------------------------------------------------

export type CyclePhase = 'submission' | 'apuracao' | 'closed'

export function midMonth(dateIso: string): string {
  const [y, m] = dateIso.slice(0, 7).split('-')
  return `${y}-${m}-15`
}

export function lastDayOfMonth(dateIso: string): string {
  const [y, m] = dateIso.slice(0, 7).split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

export function cyclePhase(
  cycle: { status: CycleStatus; opens_at: string },
  today: string = new Date().toISOString().slice(0, 10)
): CyclePhase {
  if (cycle.status === 'closed') return 'closed'
  return today.slice(0, 10) > midMonth(cycle.opens_at) ? 'apuracao' : 'submission'
}
