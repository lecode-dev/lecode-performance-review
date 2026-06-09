// store.jsx — mock domain data + store + score helpers (LeCode Performance Review)

// ---------------- Dimensions & form ----------------
const DIMENSIONS = [
  { key: "tech", n: 1, label: "Competência Técnica", short: "Técnica",
    desc: "Qualidade do código, conhecimento técnico, resolução de problemas.",
    questions: [
      "Escreve código legível, bem estruturado e seguindo boas práticas (SOLID, Clean Code, convenções do projeto).",
      "Demonstra domínio da stack, entende impactos técnicos das decisões e propõe melhorias quando apropriado.",
      "Resolve problemas técnicos de forma eficiente, considerando performance e escalabilidade.",
      "Busca aprender novas tecnologias, acompanha tendências e aplica conhecimentos no dia a dia.",
      "Contribui para a qualidade via code reviews construtivos, testes automatizados e refatorações." ] },
  { key: "delivery", n: 2, label: "Entrega e Resultados", short: "Entrega",
    desc: "Cumprimento de prazos, qualidade das entregas, produtividade.",
    questions: [
      "Cumpre prazos acordados de forma consistente, comunicando proativamente riscos e impedimentos.",
      "Entrega funcionalidades completas, testadas e com baixo índice de bugs, atendendo aos critérios de aceitação.",
      "Mantém produtividade adequada ao nível, evoluindo em velocidade e qualidade ao longo do tempo.",
      "Demonstra comprometimento com os objetivos do projeto, priorizando entregas de valor.",
      "Mantém desempenho consistente, sem oscilações significativas de qualidade ou produtividade." ] },
  { key: "comm", n: 3, label: "Comunicação", short: "Comunicação",
    desc: "Clareza, proatividade, feedback, documentação.",
    questions: [
      "Comunica-se de forma clara e objetiva, adaptando a linguagem ao público e contexto.",
      "Reporta proativamente o status, antecipa riscos e comunica impedimentos antes que virem problemas críticos.",
      "Recebe feedback de forma construtiva, com abertura para críticas, e implementa melhorias sugeridas.",
      "Produz documentação técnica clara e útil (READMEs, comentários, wikis), facilitando manutenção e onboarding.",
      "Participa ativamente de reuniões, contribui com ideias relevantes e respeita o tempo dos demais." ] },
  { key: "collab", n: 4, label: "Colaboração", short: "Colaboração",
    desc: "Trabalho em equipe, apoio a colegas, atitude positiva.",
    questions: [
      "Trabalha bem em equipe, compartilha conhecimento e contribui para o sucesso coletivo.",
      "Demonstra disposição genuína para ajudar colegas, oferecendo suporte técnico e mentoria.",
      "Mantém atitude positiva mesmo em situações desafiadoras, preservando o clima da equipe.",
      "Respeita decisões técnicas do time mesmo quando discorda, de forma profissional.",
      "Contribui para um ambiente de trabalho saudável, inclusivo e psicologicamente seguro." ] },
  { key: "autonomy", n: 5, label: "Autonomia e Iniciativa", short: "Autonomia",
    desc: "Proatividade, resolução independente, sugestões de melhoria.",
    questions: [
      "Trabalha de forma independente no nível esperado para o cargo, buscando ajuda apenas quando necessário.",
      "Identifica e resolve problemas proativamente, sem esperar que sejam reportados.",
      "Propõe melhorias técnicas, de processo ou de produto de forma embasada.",
      "Voluntaria-se para assumir responsabilidades além do escopo básico, demonstrando interesse em crescer.",
      "Gerencia bem seu tempo e tarefas, sem necessidade de microgerenciamento." ] },
];

const OPEN_QUESTIONS = [
  { key: "strengths", label: "Quais foram os principais pontos fortes?", hint: "Descreva as principais qualidades e contribuições observadas no período." },
  { key: "growth", label: "Quais áreas precisam de desenvolvimento?", hint: "Identifique oportunidades de melhoria e crescimento." },
  { key: "extra", label: "Feedback adicional ou sugestões?", hint: "Compartilhe observações adicionais ou recomendações." },
];

const SCALE = [
  { v: 1, label: "Insatisfatório" },
  { v: 2, label: "Abaixo do Esperado" },
  { v: 3, label: "Atende Expectativas" },
  { v: 4, label: "Acima do Esperado" },
  { v: 5, label: "Excepcional" },
];

const DECISIONS = [
  { min: 5.0, max: 5.01, tier: 5, label: "Elegível para promoção vertical", short: "Promoção vertical",
    desc: "Desempenho excepcional. Avaliar mudança de cargo/nível." },
  { min: 4.0, max: 5.0, tier: 4, label: "Elegível para promoção horizontal", short: "Promoção horizontal",
    desc: "Acima da média. Avaliar ajuste salarial / senioridade." },
  { min: 3.0, max: 4.0, tier: 3, label: "Plano de desenvolvimento", short: "Plano de desenvolvimento",
    desc: "Atende às expectativas. Definir PDI com metas de evolução." },
  { min: 2.0, max: 3.0, tier: 2, label: "Plano de recuperação de 30 dias", short: "Recuperação 30 dias",
    desc: "Abaixo do esperado. Acompanhamento próximo por 30 dias." },
  { min: 0, max: 2.0, tier: 1, label: "Continuidade no projeto precisa ser avaliada", short: "Avaliar continuidade",
    desc: "Insatisfatório. Revisar alocação e contrato." },
];

function decisionFor(score) {
  if (score == null) return null;
  return DECISIONS.find(d => score >= d.min && score < d.max) || DECISIONS[DECISIONS.length - 1];
}
function tierOf(v) { return Math.max(1, Math.min(5, Math.round(v))); }
function fmt(v) { return v == null ? "—" : (Math.round(v * 100) / 100).toFixed(2); }
// DD/MM/YYYY a partir de YYYY-MM-DD
function fmtBR(d) { return d ? d.split("-").reverse().join("/") : "—"; }

// ---------------- Seed data ----------------
const CLIENTS = [
  { id: "c1", name: "Fintrack", industry: "Fintech · Pagamentos", color: "oklch(0.55 0.16 264)", rep: "Marina Alves", repRole: "Head of Engineering" },
  { id: "c2", name: "Helsa Health", industry: "HealthTech", color: "oklch(0.6 0.13 180)", rep: "Daniel Costa", repRole: "Tech Lead" },
  { id: "c3", name: "RetailNova", industry: "E-commerce · Varejo", color: "oklch(0.62 0.16 35)", rep: "Patrícia Lemos", repRole: "Product Director" },
];

const CONTRACTORS = [
  { id: "u1", name: "Rafael Moreira", role: "Senior Frontend Engineer", track: "Dev", seniority: "Sênior", clientId: "c1", color: "oklch(0.55 0.16 264)", since: "2024-02" },
  { id: "u2", name: "Beatriz Nunes", role: "Backend Engineer", track: "Dev", seniority: "Pleno", clientId: "c1", color: "oklch(0.58 0.15 320)", since: "2024-08" },
  { id: "u3", name: "Lucas Carvalho", role: "Project Manager", track: "Gestão", seniority: "Sênior", clientId: "c1", color: "oklch(0.5 0.14 150)", since: "2023-11" },
  { id: "u4", name: "Camila Rocha", role: "Full-stack Engineer", track: "Dev", seniority: "Pleno", clientId: "c2", color: "oklch(0.6 0.13 180)", since: "2024-05" },
  { id: "u5", name: "Thiago Barros", role: "DevOps Engineer", track: "Dev", seniority: "Sênior", clientId: "c2", color: "oklch(0.55 0.15 60)", since: "2024-01" },
  { id: "u6", name: "Juliana Pires", role: "QA Engineer", track: "Dev", seniority: "Júnior", clientId: "c3", color: "oklch(0.62 0.16 35)", since: "2025-03" },
  { id: "u7", name: "André Santos", role: "Mobile Engineer", track: "Dev", seniority: "Pleno", clientId: "c3", color: "oklch(0.5 0.16 290)", since: "2024-09" },
  { id: "u8", name: "Fernanda Lima", role: "Frontend Engineer", track: "Dev", seniority: "Pleno", clientId: null, color: "oklch(0.58 0.14 200)", since: "2025-01" },
];

const CYCLES = [
  { id: "y1", label: "Jul/2025", start: "2025-07-01", submitEnd: "2025-07-15", end: "2025-07-31", status: "closed" },
  { id: "y2", label: "Jan/2026", start: "2026-01-01", submitEnd: "2026-01-15", end: "2026-01-31", status: "closed" },
  { id: "y3", label: "Jun/2026", start: "2026-06-01", submitEnd: "2026-06-15", end: "2026-06-30", status: "open" },
];

// Última data (YYYY-MM-DD) do mês de uma data.
function lastDayOfMonth(yyyy_mm_dd) {
  const [y, m] = yyyy_mm_dd.split("-").map(Number);
  return new Date(y, m, 0).toISOString().slice(0, 10);
}
// Dia 15 do mês de uma data.
function midMonth(yyyy_mm_dd) {
  const [y, m] = yyyy_mm_dd.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-15`;
}
// Fase do ciclo conforme a data atual: "submission" | "apuracao" | "closed".
function cyclePhase(cycle, today) {
  if (cycle.status === "closed") return "closed";
  const t = today || "2026-06-04";
  if (cycle.submitEnd && t > cycle.submitEnd) return "apuracao";
  return "submission";
}

// reviews: keyed list. dims values are 1..5 (per-dimension average).
function mkDims(a) { return { tech: a[0], delivery: a[1], comm: a[2], collab: a[3], autonomy: a[4] }; }
let REVIEWS = [
  // ---- Jul/2025 (closed) ----
  { cycleId: "y1", contractorId: "u1", type: "self",   status: "done", dims: mkDims([4.2,4.0,3.8,4.4,4.0]), open: {} },
  { cycleId: "y1", contractorId: "u1", type: "client", status: "done", dims: mkDims([4.4,4.2,4.0,4.6,4.2]), open: {} },
  { cycleId: "y1", contractorId: "u3", type: "self",   status: "done", dims: mkDims([4.6,4.8,4.6,4.4,4.8]), open: {} },
  { cycleId: "y1", contractorId: "u3", type: "client", status: "done", dims: mkDims([4.8,5.0,4.8,4.8,5.0]), open: {} },
  { cycleId: "y1", contractorId: "u5", type: "self",   status: "done", dims: mkDims([3.2,3.0,2.8,3.4,3.0]), open: {} },
  { cycleId: "y1", contractorId: "u5", type: "client", status: "done", dims: mkDims([2.8,2.6,2.4,3.0,2.6]), open: {} },
  // ---- Jan/2026 (closed) ----
  { cycleId: "y2", contractorId: "u1", type: "self",   status: "done", dims: mkDims([4.4,4.2,4.2,4.4,4.4]),
    open: { strengths: "Liderança técnica no refactor do checkout; mentoria consistente.", growth: "Aprofundar testes e2e.", extra: "Pronto para escopo de tech lead." } },
  { cycleId: "y2", contractorId: "u1", type: "client", status: "done", dims: mkDims([4.6,4.6,4.4,4.8,4.6]),
    open: { strengths: "Entregas de altíssima qualidade, referência para o time do cliente.", growth: "Documentar mais decisões de arquitetura.", extra: "Excelente parceria." } },
  { cycleId: "y2", contractorId: "u2", type: "self",   status: "done", dims: mkDims([3.6,3.8,3.4,3.8,3.6]), open: { strengths: "Boa evolução no domínio de filas e mensageria." } },
  { cycleId: "y2", contractorId: "u2", type: "client", status: "done", dims: mkDims([3.8,4.0,3.6,4.0,3.8]), open: { strengths: "Confiável nas entregas do backend." } },
  { cycleId: "y2", contractorId: "u3", type: "self",   status: "done", dims: mkDims([4.6,4.8,4.8,4.6,4.8]), open: {} },
  { cycleId: "y2", contractorId: "u3", type: "client", status: "done", dims: mkDims([4.8,5.0,5.0,5.0,5.0]), open: { strengths: "Gestão impecável do roadmap." } },
  { cycleId: "y2", contractorId: "u4", type: "self",   status: "done", dims: mkDims([3.8,3.6,3.8,4.0,3.6]), open: {} },
  { cycleId: "y2", contractorId: "u4", type: "client", status: "done", dims: mkDims([4.0,3.8,4.0,4.2,3.8]), open: {} },
  { cycleId: "y2", contractorId: "u5", type: "self",   status: "done", dims: mkDims([3.4,3.2,3.0,3.6,3.4]), open: {} },
  { cycleId: "y2", contractorId: "u5", type: "client", status: "done", dims: mkDims([3.0,2.8,2.6,3.2,2.8]),
    open: { growth: "Comunicação de impedimentos precisa ser mais proativa.", extra: "Acompanhamento sugerido." } },
  { cycleId: "y2", contractorId: "u6", type: "self",   status: "done", dims: mkDims([2.8,2.6,3.0,3.2,2.6]), open: {} },
  { cycleId: "y2", contractorId: "u6", type: "client", status: "done", dims: mkDims([2.6,2.4,2.8,3.0,2.4]),
    open: { growth: "Aprofundar automação de testes; ganhar autonomia.", extra: "Plano de recuperação iniciado." } },
  { cycleId: "y2", contractorId: "u7", type: "self",   status: "done", dims: mkDims([4.0,3.8,3.6,3.8,4.0]), open: {} },
  { cycleId: "y2", contractorId: "u7", type: "client", status: "done", dims: mkDims([4.2,4.0,3.8,4.0,4.2]), open: {} },
  // ---- Jul/2026 (open / in progress) ----
  { cycleId: "y3", contractorId: "u1", type: "self",   status: "done", dims: mkDims([4.6,4.4,4.4,4.6,4.6]),
    open: { strengths: "Conduzi a migração para Server Components reduzindo TBT em 40%.", growth: "Quero assumir mais ownership de produto." } },
  { cycleId: "y3", contractorId: "u1", type: "client", status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u2", type: "self",   status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u2", type: "client", status: "done", dims: mkDims([3.8,4.0,3.8,4.2,3.8]), open: {} },
  { cycleId: "y3", contractorId: "u3", type: "self",   status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u3", type: "client", status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u4", type: "self",   status: "done", dims: mkDims([4.0,3.8,4.0,4.2,3.8]), open: {} },
  { cycleId: "y3", contractorId: "u4", type: "client", status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u5", type: "self",   status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u5", type: "client", status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u6", type: "self",   status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u6", type: "client", status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u7", type: "self",   status: "pending", dims: null, open: {} },
  { cycleId: "y3", contractorId: "u7", type: "client", status: "pending", dims: null, open: {} },
];

// ---------------- Contractor change history (audit) ----------------
// type: "profile" (cargo/senioridade/trilha) | "allocation"
let CONTRACTOR_HISTORY = [
  { id: "h1", contractorId: "u1", at: "2025-07-16", by: "Marcos Tavares", field: "seniority", from: "Pleno", to: "Sênior", note: "Promoção após ciclo Jul/2025 (score 4.34)." },
  { id: "h2", contractorId: "u1", at: "2024-02-01", by: "Marcos Tavares", field: "allocation", from: "—", to: "Fintrack", note: "Alocação inicial." },
  { id: "h3", contractorId: "u3", at: "2026-01-23", by: "Marcos Tavares", field: "role", from: "Project Manager", to: "Senior Project Manager", note: "Promoção horizontal (score 4.86)." },
];

// ---------------- Store ----------------
const StoreContext = React.createContext(null);

function StoreProvider({ children }) {
  const [clients] = React.useState(CLIENTS);
  const [contractors, setContractors] = React.useState(CONTRACTORS);
  const [cycles, setCycles] = React.useState(CYCLES);
  const [reviews, setReviews] = React.useState(REVIEWS);
  const [history, setHistory] = React.useState(CONTRACTOR_HISTORY);

  const api = {
    clients, contractors, cycles, reviews, history,
    DIMENSIONS, OPEN_QUESTIONS, SCALE, DECISIONS,
    decisionFor, tierOf, fmt, cyclePhase, lastDayOfMonth, midMonth,

    getContractor: (id) => contractors.find(c => c.id === id),
    getClient: (id) => clients.find(c => c.id === id),
    getCycle: (id) => cycles.find(c => c.id === id),
    activeCycle: () => cycles.find(c => c.status === "open"),
    contractorsOfClient: (cid) => contractors.filter(c => c.clientId === cid),

    review: (cycleId, contractorId, type) =>
      reviews.find(r => r.cycleId === cycleId && r.contractorId === contractorId && r.type === type),

    dimAvg: (r) => {
      if (!r || !r.dims) return null;
      const vs = Object.values(r.dims);
      return vs.reduce((a, b) => a + b, 0) / vs.length;
    },
    finalScore: function (cycleId, contractorId) {
      const self = this.review(cycleId, contractorId, "self");
      const cli = this.review(cycleId, contractorId, "client");
      const sa = this.dimAvg(self), ca = this.dimAvg(cli);
      if (sa == null || ca == null) return null;
      return sa * 0.3 + ca * 0.7;
    },

    // Cycle progress for a given client (or all)
    cycleProgress: function (cycleId, clientId) {
      const pool = clientId ? this.contractorsOfClient(clientId) : contractors.filter(c => c.clientId);
      let done = 0, total = 0;
      pool.forEach(c => {
        ["self", "client"].forEach(t => {
          total++;
          const r = this.review(cycleId, c.id, t);
          if (r && r.status === "done") done++;
        });
      });
      return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    },
    canCloseCycle: function (cycleId) {
      return this.cycleProgress(cycleId).done === this.cycleProgress(cycleId).total;
    },

    submitReview: (cycleId, contractorId, type, dims, open, answers) => {
      setReviews(prev => {
        const idx = prev.findIndex(r => r.cycleId === cycleId && r.contractorId === contractorId && r.type === type);
        const rec = { cycleId, contractorId, type, status: "done", dims, open: open || {}, answers: answers || null, submittedAt: "2026-06-04" };
        if (idx >= 0) { const cp = [...prev]; cp[idx] = rec; return cp; }
        return [...prev, rec];
      });
    },
    openCycle: (label, start, submitEnd, end) => {
      setCycles(prev => [...prev, { id: "y" + (prev.length + 1), label, start, submitEnd, end, status: "open" }]);
    },
    closeCycle: (cycleId) => setCycles(prev => prev.map(c => c.id === cycleId ? { ...c, status: "closed" } : c)),

    contractorHistory: (contractorId) => history.filter(h => h.contractorId === contractorId).sort((a, b) => b.at.localeCompare(a.at)),
    logChange: (entry) => setHistory(prev => [...prev, { id: "h" + (prev.length + 1), at: "2026-06-04", by: "Marcos Tavares", ...entry }]),

    addContractor: (data) => setContractors(prev => [...prev, { id: "u" + (prev.length + 1), color: "oklch(0.56 0.15 264)", ...data }]),
    setAllocation: function (contractorId, clientId) {
      const c = contractors.find(x => x.id === contractorId);
      const fromName = c?.clientId ? (clients.find(cl => cl.id === c.clientId)?.name || "—") : "—";
      const toName = clientId ? (clients.find(cl => cl.id === clientId)?.name || "—") : "—";
      if (fromName !== toName) this.logChange({ contractorId, field: "allocation", from: fromName, to: toName });
      setContractors(prev => prev.map(x => x.id === contractorId ? { ...x, clientId } : x));
    },
    updateContractor: function (contractorId, data) {
      const c = contractors.find(x => x.id === contractorId);
      if (c) {
        [["role", "role"], ["seniority", "seniority"], ["track", "track"]].forEach(([k, field]) => {
          if (data[k] != null && data[k] !== c[k]) this.logChange({ contractorId, field, from: c[k], to: data[k] });
        });
      }
      setContractors(prev => prev.map(x => x.id === contractorId ? { ...x, ...data } : x));
    },
  };
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}
function useStore() { return React.useContext(StoreContext); }

Object.assign(window, { StoreProvider, useStore, DIMENSIONS, OPEN_QUESTIONS, SCALE, DECISIONS, decisionFor, tierOf, fmt, fmtBR, cyclePhase, lastDayOfMonth, midMonth });
