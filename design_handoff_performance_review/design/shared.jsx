// shared.jsx — evaluation form + review detail (used across roles)

// ---------------- Evaluation form ----------------
function EvaluationForm({ cycle, contractor, type, existing, onSubmit, onCancel }) {
  const store = useStore();
  const { t } = useLang();
  // answers[dimKey] = [q1..q5]
  const init = () => {
    const a = {};
    DIMENSIONS.forEach(d => {
      if (existing && existing.answers && existing.answers[d.key]) {
        a[d.key] = [...existing.answers[d.key]];
      } else if (existing && existing.dims && existing.dims[d.key] != null) {
        // seeded review without raw answers — prefill each question with the rounded dimension score
        a[d.key] = [0, 0, 0, 0, 0].map(() => Math.round(existing.dims[d.key]));
      } else {
        a[d.key] = [null, null, null, null, null];
      }
    });
    return a;
  };
  const [answers, setAnswers] = React.useState(init);
  const [open, setOpen] = React.useState(() => ({
    strengths: existing?.open?.strengths || "",
    growth: existing?.open?.growth || "",
    extra: existing?.open?.extra || "",
  }));
  const [activeDim, setActiveDim] = React.useState(DIMENSIONS[0].key);
  const isEditing = !!(existing && existing.status === "done");

  const setAns = (dk, qi, v) => setAnswers(p => ({ ...p, [dk]: p[dk].map((x, i) => i === qi ? v : x) }));

  const dimAvg = (dk) => {
    const vs = answers[dk].filter(v => v != null);
    return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
  };
  const dimComplete = (dk) => answers[dk].every(v => v != null);
  const answeredCount = Object.values(answers).flat().filter(v => v != null).length;
  const allComplete = DIMENSIONS.every(d => dimComplete(d.key));
  const overall = (() => {
    const avgs = DIMENSIONS.map(d => dimAvg(d.key)).filter(v => v != null);
    return avgs.length === DIMENSIONS.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
  })();

  const submit = () => {
    const dims = {};
    DIMENSIONS.forEach(d => { dims[d.key] = dimAvg(d.key); });
    const rawAnswers = {};
    DIMENSIONS.forEach(d => { rawAnswers[d.key] = [...answers[d.key]]; });
    onSubmit(dims, open, rawAnswers);
  };

  const isSelf = type === "self";
  const subject = isSelf ? t("Auto-avaliação") : t("Avaliação do cliente");

  return (
    <div className="anim-in">
      <div className="page-head">
        <div className="eyebrow">{cycle.label} · {subject}</div>
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div>
            <h2>{isSelf ? t("Como você avalia seu desempenho?") : `${t("Avaliar")} ${contractor.name}`}</h2>
            <p>{isSelf
              ? t("Reflita honestamente sobre o ciclo. Cada item usa a escala de 1 a 5. Sua nota tem peso de 30% no score final.")
              : `${contractor.role} · ${t("alocado em")} ${store.getClient(contractor.clientId)?.name}. ${t("A avaliação do cliente tem peso de 70% no score final.")}`}</p>
          </div>
          {!isSelf && <Avatar person={contractor} size="lg" />}
        </div>
      </div>

      {/* Scale legend */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="row wrap" style={{ gap: 14, justifyContent: "space-between" }}>
          {SCALE.map(s => (
            <div key={s.v} className="row" style={{ gap: 8 }}>
              <span className={"score-chip tier-" + s.v} style={{ minWidth: 30 }}>{s.v}</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{t(s.label)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="l-form">
        {/* Dimension rail */}
        <div className="l-form-rail">
          {DIMENSIONS.map(d => {
            const done = dimComplete(d.key);
            const av = dimAvg(d.key);
            return (
              <button key={d.key} className="nav-item" style={{ marginBottom: 2 }}
                onClick={() => { setActiveDim(d.key); const el = document.getElementById("dim-" + d.key); if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 76, behavior: "smooth" }); }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center",
                  background: done ? `var(--s${tierOf(av)})` : "var(--surface-3)", color: done ? "#fff" : "var(--ink-3)",
                  fontFamily: "var(--mono)", fontSize: 11, flex: "none" }}>
                  {done ? av.toFixed(1) : d.n}
                </span>
                <span style={{ fontSize: 12.5 }}>{t(d.short)}</span>
              </button>
            );
          })}
          <div className="divider" />
          <div style={{ padding: "0 10px" }}>
            <div className="muted" style={{ fontSize: 11.5 }}>{t("Respondidas")}</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{answeredCount}/25</div>
            <div className="progress" style={{ marginTop: 8 }}><span style={{ width: (answeredCount / 25 * 100) + "%" }} /></div>
          </div>
        </div>

        {/* Questions */}
        <div className="col" style={{ gap: 18 }}>
          {DIMENSIONS.map(d => (
            <div className="card" key={d.key} id={"dim-" + d.key}>
              <div className="card-head">
                <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent-ink)",
                  display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 600, fontSize: 13 }}>{d.n}</span>
                <div className="col" style={{ gap: 1 }}>
                  <h3>{t(d.label)}</h3>
                  <span className="sub">{t(d.desc)}</span>
                </div>
                <span style={{ marginLeft: "auto" }}><ScoreChip value={dimAvg(d.key)} /></span>
              </div>
              <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 8 }}>
                {d.questions.map((q, qi) => (
                  <div key={qi} className="between q-row" style={{ alignItems: "center", gap: 18, padding: "13px 0", borderBottom: qi < 4 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.45, maxWidth: "60ch" }}>
                      <span className="mono muted" style={{ fontSize: 11, marginRight: 8 }}>{d.n}.{qi + 1}</span>{t(q)}
                    </div>
                    <RatingInput value={answers[d.key][qi]} onChange={v => setAns(d.key, qi, v)} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Open questions */}
          <div className="card">
            <div className="card-head"><Icon name="form" size={16} /><h3>{t("Perguntas abertas")} <span className="muted" style={{ fontWeight: 400 }}>· {t("opcionais")}</span></h3></div>
            <div className="card-pad col" style={{ gap: 16 }}>
              {OPEN_QUESTIONS.map(o => (
                <div className="field" key={o.key}>
                  <label>{t(o.label)}</label>
                  <textarea className="textarea" placeholder={t(o.hint)} value={open[o.key]}
                    onChange={e => setOpen(p => ({ ...p, [o.key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky submit bar */}
      <div className="card submit-bar" style={{ position: "sticky", bottom: 16, marginTop: 20, boxShadow: "var(--shadow-lg)" }}>
        <div className="between" style={{ padding: "14px 20px" }}>
          <div className="row" style={{ gap: 16 }}>
            <div>
              <div className="muted" style={{ fontSize: 11.5 }}>{t("Média parcial")}</div>
              <div className="row" style={{ gap: 10 }}><ScoreChip value={overall} lg /></div>
            </div>
            {!allComplete && <div className="muted" style={{ fontSize: 12.5, maxWidth: "32ch" }}>{t("Responda as 25 perguntas para concluir")} · {25 - answeredCount} {t("restantes")}</div>}
          </div>
          <div className="row" style={{ gap: 10 }}>
            {onCancel && <button className="btn btn-ghost" onClick={onCancel}>{t("Cancelar")}</button>}
            <button className="btn btn-primary" disabled={!allComplete} onClick={submit}>
              <Icon name="check" size={16} />{isEditing ? t("Salvar alterações") : t("Enviar avaliação")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Review detail / comparison ----------------
function ReviewDetail({ cycle, contractor, perspective }) {
  // perspective: "admin" | "client" | "contractor" — controls whether the *other* review is visible
  const store = useStore();
  const { t } = useLang();
  const self = store.review(cycle.id, contractor.id, "self");
  const client = store.review(cycle.id, contractor.id, "client");
  const selfDone = self && self.status === "done";
  const clientDone = client && client.status === "done";
  const cycleClosed = cycle.status === "closed";

  // visibility rules to avoid bias
  let showSelf = true, showClient = true, blindReason = null;
  if (perspective === "client") {
    showSelf = cycleClosed; // client sees self-review only after cycle closes
    if (!cycleClosed) blindReason = t("A auto-avaliação do contratado só fica visível após o encerramento do ciclo.");
  } else if (perspective === "contractor") {
    showClient = cycleClosed; // contractor sees client review only after cycle closes
    if (!cycleClosed) blindReason = t("A avaliação do cliente só fica visível após o encerramento do ciclo, evitando viés na sua auto-avaliação.");
  }

  const selfAvg = store.dimAvg(self), clientAvg = store.dimAvg(client);
  const final = store.finalScore(cycle.id, contractor.id);
  const bothVisible = showSelf && selfDone && showClient && clientDone;

  return (
    <div className="col" style={{ gap: 18 }}>
      {/* Header score row */}
      <div className="grid grid-3">
        <div className="card stat">
          <div className="label"><Icon name="users" size={15} />{t("Self review")} <span className="mono muted">30%</span></div>
          <div className="value">{showSelf ? <ScoreChip value={selfAvg} lg /> : <Icon name="lock" size={22} />}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{!selfDone ? t("Pendente") : showSelf ? t("Concluída") : t("Oculta até o encerramento")}</div>
        </div>
        <div className="card stat">
          <div className="label"><Icon name="building" size={15} />{t("Review cliente")} <span className="mono muted">70%</span></div>
          <div className="value">{showClient ? <ScoreChip value={clientAvg} lg /> : <Icon name="lock" size={22} />}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{!clientDone ? t("Pendente") : showClient ? t("Concluída") : t("Oculta até o encerramento")}</div>
        </div>
        <div className="card stat" style={{ outline: final != null ? "2px solid var(--accent-soft)" : "none" }}>
          <div className="label"><Icon name="award" size={15} />{t("Score final")}</div>
          <div className="value">{(perspective !== "admin" && !cycleClosed) ? <span className="muted">—</span> : <ScoreChip value={final} lg />}</div>
          <div className="muted mono" style={{ fontSize: 11.5, marginTop: 6 }}>{t("self·0.30 + cliente·0.70")}</div>
        </div>
      </div>

      {(perspective === "admin" || cycleClosed) && final != null && <DecisionBanner score={final} />}
      {blindReason && <div className="callout"><Icon name="lock" />{blindReason}</div>}

      <div className={"l-split s320" + (bothVisible ? "" : " l-split-single")}>
        <div className="card">
          <div className="card-head"><Icon name="dashboard" size={16} /><h3>{t("Notas por dimensão")}</h3></div>
          <div className="card-pad">
            {DIMENSIONS.map(d => {
              const sv = showSelf && selfDone ? self.dims[d.key] : null;
              const cv = showClient && clientDone ? client.dims[d.key] : null;
              return (
                <div key={d.key} style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="between" style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{t(d.label)}</span>
                    <div className="row" style={{ gap: 8 }}>
                      {sv != null && <span className="badge" title="Self"><span className="lg-dot" style={{ background: "var(--s2)", width: 7, height: 7 }} />{fmt(sv)}</span>}
                      {cv != null && <span className="badge" title="Cliente"><span className="lg-dot" style={{ background: "var(--accent)", width: 7, height: 7 }} />{fmt(cv)}</span>}
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 8, borderRadius: 6, background: "var(--surface-3)" }}>
                    {cv != null && <div style={{ position: "absolute", inset: 0, width: (cv / 5 * 100) + "%", background: "var(--accent)", borderRadius: 6, opacity: .9 }} />}
                    {sv != null && <div style={{ position: "absolute", top: -2, height: 12, width: 2, left: `calc(${sv / 5 * 100}% - 1px)`, background: "var(--s2)", borderRadius: 2 }} title="Self" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {bothVisible && (
          <div className="card card-pad">
            <Radar self={self.dims} client={client.dims} />
          </div>
        )}
      </div>

      {/* Open answers */}
      {(showSelf || showClient) && (
        <div className="grid grid-2">
          {showSelf && selfDone && <OpenCard title={t("Auto-avaliação")} icon="users" open={self.open} dotColor="var(--s2)" />}
          {showClient && clientDone && <OpenCard title={`${t("Cliente")} · ${store.getClient(contractor.clientId)?.name || ""}`} icon="building" open={client.open} dotColor="var(--accent)" />}
        </div>
      )}
    </div>
  );
}

function OpenCard({ title, icon, open, dotColor }) {
  const { t } = useLang();
  const has = open && Object.values(open).some(v => v && v.trim());
  return (
    <div className="card">
      <div className="card-head"><span className="lg-dot" style={{ background: dotColor, width: 9, height: 9 }} /><h3>{title}</h3></div>
      <div className="card-pad col" style={{ gap: 14 }}>
        {!has && <div className="muted" style={{ fontSize: 13 }}>{t("Sem comentários abertos neste ciclo.")}</div>}
        {OPEN_QUESTIONS.map(o => open && open[o.key] ? (
          <div key={o.key}>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 3 }}>{t(o.label)}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{open[o.key]}</div>
          </div>
        ) : null)}
      </div>
    </div>
  );
}

Object.assign(window, { EvaluationForm, ReviewDetail, OpenCard });
