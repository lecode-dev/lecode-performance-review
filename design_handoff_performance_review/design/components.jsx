// components.jsx — shared UI for LeCode Performance Review

// ---------------- Icons (simple line glyphs) ----------------
const PATHS = {
  dashboard: "M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  building: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v0M9 12v0M9 15v0M9 18v0",
  cycle: "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6",
  form: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h6",
  history: "M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2",
  plus: "M12 5v14M5 12h14",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  chevron: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  arrowRight: "M5 12h14M13 5l7 7-7 7",
  star: "M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 16v-4M12 8h.01",
  trend: "M22 7l-8.5 8.5-5-5L2 17M16 7h6v6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.2 13.9 7 22l5-3 5 3-1.2-8.1",
  warning: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  filter: "M22 3H2l8 9.5V19l4 2v-8.5z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M9.9 4.2A9.5 9.5 0 0 1 12 4c6.5 0 10 7 10 7a13 13 0 0 1-2.2 2.9M6.6 6.6A13 13 0 0 0 2 11s3.5 7 10 7a9.5 9.5 0 0 0 3.9-.8M3 3l18 18M9.5 9.5a3 3 0 0 0 4 4",
  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6",
  menu: "M3 6h18M3 12h18M3 18h18",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  shield: "M12 2l8 3v6c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V5z",
  shieldCheck: "M12 2l8 3v6c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V5zM9 12l2 2 4-4",
};
function Icon({ name, size = 18, className = "", style }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={PATHS[name] || ""} />
    </svg>
  );
}

// ---------------- primitives ----------------
function Avatar({ person, size = "" }) {
  const initials = person.name.split(" ").map(w => w[0]).slice(0, 2).join("");
  return <div className={"avatar " + size} style={{ background: person.color }}>{initials}</div>;
}
function Person({ person, sub }) {
  return (
    <div className="person">
      <Avatar person={person} />
      <div className="col" style={{ minWidth: 0 }}>
        <span className="pn">{person.name}</span>
        <span className="pr">{sub != null ? sub : person.role}</span>
      </div>
    </div>
  );
}
function Badge({ children, kind = "", className = "", dot = false }) {
  return <span className={`badge ${kind ? "badge-" + kind : ""} ${dot ? "dot" : ""} ${className}`}>{children}</span>;
}
function ScoreChip({ value, lg = false }) {
  if (value == null) return <span className="score-chip" style={{ color: "var(--ink-3)", background: "var(--surface-3)" }}>—</span>;
  return <span className={`score-chip tier-${tierOf(value)} ${lg ? "lg" : ""}`}>{lg ? <CountUp end={value} decimals={2} /> : fmt(value)}</span>;
}
function Stat({ label, icon, value, unit, delta, deltaDir }) {
  return (
    <div className="card stat">
      <div className="label">{icon && <Icon name={icon} size={15} />}{label}</div>
      <div className="value">{value}{unit && <small> {unit}</small>}</div>
      {delta && <div className={"delta " + (deltaDir || "")}>{delta}</div>}
    </div>
  );
}
function Progress({ pct }) { return <div className="progress"><span style={{ width: pct + "%" }} /></div>; }

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.id} className={"tab " + (value === t.id ? "active" : "")} onClick={() => onChange(t.id)}>
          {t.label}{t.count != null && <span style={{ marginLeft: 6, opacity: .6, fontFamily: "var(--mono)" }}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose, footer, wide }) {
  React.useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <div className="overlay" onClick={onClose}>
      <div className={"modal " + (wide ? "wide" : "")} onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><Icon name="x" /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------- Rating input ----------------
function RatingInput({ value, onChange }) {
  return (
    <div className="rating">
      {[1, 2, 3, 4, 5].map(v => (
        <button key={v} type="button"
          className={"rating-opt " + (value === v ? "sel-" + v : "")}
          onClick={() => onChange(v)}>{v}</button>
      ))}
    </div>
  );
}

// ---------------- Dimension bars ----------------
function DimensionBars({ dims, compact }) {
  const { t } = useLang();
  if (!dims) return <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>{t("Sem dados.")}</div>;
  return (
    <div>
      {DIMENSIONS.map(d => {
        const v = dims[d.key];
        return (
          <div className="dimbar" key={d.key}>
            <span className="dl">{t(compact ? d.short : d.label)}</span>
            <span className="track"><span className={"fill fill-" + tierOf(v)} style={{ width: (v / 5 * 100) + "%" }} /></span>
            <span className="dv" style={{ color: `var(--s${tierOf(v)})` }}>{fmt(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------- Radar chart (self vs client) ----------------
function Radar({ self, client, size = 260 }) {
  const { t: tt } = useLang();
  const cx = size / 2, cy = size / 2, R = size / 2 - 38;
  const axes = DIMENSIONS;
  const N = axes.length;
  const ang = i => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const polygon = (dims) => dims ? axes.map((a, i) => pt(i, (dims[a.key] / 5) * R).join(",")).join(" ") : "";
  const rings = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map(r => (
          <polygon key={r} points={axes.map((a, i) => pt(i, (r / 5) * R).join(",")).join(" ")}
            fill="none" stroke="var(--border)" strokeWidth="1" />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
        })}
        {client && <polygon points={polygon(client)} fill="color-mix(in oklab, var(--accent) 18%, transparent)" stroke="var(--accent)" strokeWidth="2" />}
        {self && <polygon points={polygon(self)} fill="color-mix(in oklab, var(--s3) 16%, transparent)" stroke="var(--s2)" strokeWidth="2" strokeDasharray="4 3" />}
        {axes.map((a, i) => {
          const [x, y] = pt(i, R + 18);
          return <text key={i} x={x} y={y} fontSize="10.5" fontFamily="var(--mono)" fill="var(--ink-3)"
            textAnchor="middle" dominantBaseline="middle">{tt(a.short)}</text>;
        })}
      </svg>
      <div className="radar-legend">
        {client && <span><span className="lg-dot" style={{ background: "var(--accent)" }} />{tt("Cliente (70%)")}</span>}
        {self && <span><span className="lg-dot" style={{ background: "var(--s2)" }} />{tt("Self (30%)")}</span>}
      </div>
    </div>
  );
}

// ---------------- Decision banner ----------------
function DecisionBanner({ score, compact }) {
  const { t } = useLang();
  const d = decisionFor(score);
  if (!d) return null;
  return (
    <div className={"decision dec-" + d.tier}>
      <Icon name={d.tier >= 4 ? "award" : d.tier <= 2 ? "warning" : "trend"} size={compact ? 18 : 22} />
      <div className="col">
        <span className="dt">{t(d.short)}</span>
        {!compact && <span className="dd">{t(d.desc)}</span>}
      </div>
    </div>
  );
}
function DecisionTag({ score }) {
  const { t } = useLang();
  const d = decisionFor(score);
  if (!d) return <Badge kind="pending">{t("aguardando")}</Badge>;
  return <span className={"score-chip tier-" + d.tier} style={{ fontSize: 11.5, minWidth: 0, padding: "3px 9px", fontWeight: 600 }}>{t(d.short)}</span>;
}

function CycleBadge({ status }) {
  const { t } = useLang();
  const map = { open: ["open", "Em andamento"], closed: ["closed", "Encerrado"], scheduled: ["scheduled", "Agendado"] };
  const [k, l] = map[status] || ["", status];
  return <Badge kind={k} dot>{t(l)}</Badge>;
}

// Phase pill: where the cycle is right now (submission / review / closed)
function PhaseBadge({ cycle }) {
  const { t } = useLang();
  const phase = cyclePhase(cycle);
  if (phase === "closed") return null;
  const map = {
    submission: ["badge-open", "Envio"],
    apuracao: ["badge-scheduled", "Apuração"],
  };
  const [cls, label] = map[phase];
  return <span className={"badge " + cls}><Icon name={phase === "submission" ? "form" : "trend"} size={12} />{t(label)}</span>;
}

// Two-phase timeline: submission (1→15) and review/discussion (15→end)
function CyclePhases({ cycle, compact }) {
  const { t } = useLang();
  const phase = cyclePhase(cycle);
  const fmtD = (d) => d ? d.split("-").reverse().slice(0, 2).join("/") : "—";
  const seg = (active, done, icon, label, range) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ height: 6, borderRadius: 4, background: active ? "var(--accent)" : done ? "color-mix(in oklab, var(--accent) 45%, var(--surface-3))" : "var(--surface-3)" }} />
      <div className="row" style={{ gap: 6, marginTop: 7, alignItems: "center" }}>
        <Icon name={icon} size={13} className={active ? "" : "muted"} style={active ? { color: "var(--accent-ink)" } : undefined} />
        <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? "var(--ink)" : "var(--ink-3)" }}>{label}</span>
        {!compact && <span className="mono muted" style={{ fontSize: 11, marginLeft: "auto" }}>{range}</span>}
      </div>
    </div>
  );
  return (
    <div className="row" style={{ gap: 12, alignItems: "stretch" }}>
      {seg(phase === "submission", phase === "apuracao" || phase === "closed", "form", t("Envio"), `${fmtD(cycle.start)}–${fmtD(cycle.submitEnd)}`)}
      {seg(phase === "apuracao", phase === "closed", "trend", t("Apuração"), `${fmtD(cycle.submitEnd)}–${fmtD(cycle.end)}`)}
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="empty">
      <div className="ic"><Icon name={icon || "info"} size={40} /></div>
      <div style={{ fontWeight: 600, color: "var(--ink-2)" }}>{title}</div>
      {text && <div style={{ fontSize: 13, marginTop: 4 }}>{text}</div>}
    </div>
  );
}

// ---------------- Confirmation dialog (double-check) ----------------
const ConfirmContext = React.createContext(() => Promise.resolve(false));
function useConfirm() { return React.useContext(ConfirmContext); }

function ConfirmProvider({ children }) {
  const [cfg, setCfg] = React.useState(null);
  const resolver = React.useRef(null);
  const confirm = React.useCallback((opts) => new Promise((res) => {
    resolver.current = res; setCfg(opts || {});
  }), []);
  const settle = (val) => { setCfg(null); if (resolver.current) { resolver.current(val); resolver.current = null; } };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {cfg && <ConfirmDialog {...cfg} onConfirm={() => settle(true)} onCancel={() => settle(false)} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ title, message, detail, confirmLabel, cancelLabel, tone = "primary", icon, onConfirm, onCancel }) {
  const { t } = useLang();
  React.useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onConfirm, onCancel]);
  const ic = icon || (tone === "danger" ? "warning" : "info");
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal confirm" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="confirm-head">
          <span className={"confirm-ic " + tone}><Icon name={ic} size={21} /></span>
          <h3>{title}</h3>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
          {detail && <div className="confirm-detail">{detail}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onCancel}>{cancelLabel || t("Cancelar")}</button>
          <button className={"btn " + (tone === "danger" ? "btn-danger-solid" : "btn-primary")} onClick={onConfirm} autoFocus>
            {confirmLabel || t("Confirmar")}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, Avatar, Person, Badge, ScoreChip, Stat, Progress, Tabs, Modal,
  RatingInput, DimensionBars, Radar, DecisionBanner, DecisionTag, CycleBadge, PhaseBadge, CyclePhases, EmptyState,
  ConfirmProvider, useConfirm,
});
