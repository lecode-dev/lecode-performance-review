// screens-contractor.jsx — Contratado LeCode

function ContractorHome({ actor, go }) {
  const s = useStore();
  const { t } = useLang();
  const me = s.getContractor(actor);
  const cycle = s.activeCycle();
  const client = s.getClient(me.clientId);
  const myself = cycle && s.review(cycle.id, actor, "self");
  const selfDone = myself?.status === "done";
  const closedCycles = s.cycles.filter(c => c.status === "closed");
  const lastClosed = closedCycles.slice(-1)[0];
  const lastFinal = lastClosed ? s.finalScore(lastClosed.id, actor) : null;

  // evolution across closed cycles
  const series = closedCycles.map(cy => ({ cy, score: s.finalScore(cy.id, actor) })).filter(x => x.score != null);

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">{me.role}{client ? ` · ${client.name}` : ""}</div>
        <h2>{t("Olá")}, {me.name.split(" ")[0]}</h2>
        <p>{t("Acompanhe seus ciclos de avaliação e seu desenvolvimento ao longo do tempo na LeCode.")}</p>
      </div>

      {/* Current cycle action */}
      {cycle ? (
        <div className="card card-pad" style={{ marginBottom: 18, borderColor: selfDone ? "var(--border)" : "color-mix(in oklab, var(--accent) 35%, var(--border))" }}>
          <div className="between" style={{ alignItems: "center" }}>
            <div className="row" style={{ gap: 14 }}>
              <span style={{ width: 46, height: 46, borderRadius: 12, background: selfDone ? "var(--s5-soft)" : "var(--accent-soft)", color: selfDone ? "var(--s5)" : "var(--accent-ink)", display: "grid", placeItems: "center" }}>
                <Icon name={selfDone ? "check" : "form"} size={22} />
              </span>
              <div className="col">
                <div className="row" style={{ gap: 10 }}><span style={{ fontWeight: 600, fontSize: 15 }}>{t("Auto-avaliação")} · {cycle.label}</span><CycleBadge status="open" /></div>
                <span className="muted" style={{ fontSize: 13 }}>{selfDone ? t("Você concluiu sua auto-avaliação. Pode revisá-la até o fim do ciclo.") : `${t("Janela aberta até")} ${fmtBR(cycle.submitEnd || cycle.end)}. ${t("Sua nota tem peso de 30% no score final.")}`}</span>
              </div>
            </div>
            <button className={"btn " + (selfDone ? "" : "btn-primary")} onClick={() => go("co_self")}>
              {selfDone ? <><Icon name="edit" size={16} />{t("Revisar")}</> : <><Icon name="star" size={16} />{t("Fazer auto-avaliação")}</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="callout" style={{ marginBottom: 18 }}><Icon name="info" />{t("Nenhum ciclo de avaliação em andamento no momento.")}</div>
      )}

      <div className="l-split s320">
        <div className="card">
          <div className="card-head"><Icon name="trend" size={16} /><h3>{t("Minha evolução")}</h3><span className="sub" style={{ marginLeft: "auto" }}>{t("score final por ciclo")}</span></div>
          <div className="card-pad">
            {series.length ? <Sparkline series={series} /> : <EmptyState icon="trend" title={t("Sem histórico ainda")} text={t("Seus scores aparecerão aqui após o primeiro ciclo encerrado.")} />}
          </div>
        </div>
        <div className="col" style={{ gap: 16 }}>
          <div className="card stat">
            <div className="label"><Icon name="award" size={15} />{t("Último score")} · {lastClosed?.label || "—"}</div>
            <div className="value"><ScoreChip value={lastFinal} lg /></div>
            {lastFinal != null && <div style={{ marginTop: 10 }}><DecisionTag score={lastFinal} /></div>}
          </div>
          <div className="card card-pad">
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{t("Alocação atual")}</div>
            {client ? <Person person={client.id ? { name: client.name, role: client.industry, color: client.color } : me} /> : <Badge kind="pending">{t("sem alocação")}</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ series }) {
  const W = 560, H = 150, pad = 28;
  const xs = (i) => pad + (i * (W - pad * 2)) / Math.max(1, series.length - 1);
  const ys = (v) => H - pad - ((v - 1) / 4) * (H - pad * 2);
  const pts = series.map((d, i) => [xs(i), ys(d.score)]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {[1, 2, 3, 4, 5].map(g => <line key={g} x1={pad} x2={W - pad} y1={ys(g)} y2={ys(g)} stroke="var(--border)" strokeWidth="1" />)}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />
          <text x={p[0]} y={p[1] - 14} fontSize="12" fontFamily="var(--mono)" fontWeight="600" fill="var(--ink)" textAnchor="middle">{fmt(series[i].score)}</text>
          <text x={p[0]} y={H - 6} fontSize="11" fontFamily="var(--mono)" fill="var(--ink-3)" textAnchor="middle">{series[i].cy.label}</text>
        </g>
      ))}
    </svg>
  );
}

function ContractorSelfReview({ actor, go }) {
  const s = useStore();
  const { t } = useLang();
  const confirm = useConfirm();
  const cycle = s.activeCycle();
  const me = s.getContractor(actor);
  const existing = cycle && s.review(cycle.id, actor, "self");
  const isEditing = existing && existing.status === "done";
  const handleSubmit = async (dims, open, answers) => {
    const ok = await confirm(isEditing ? {
      icon: "edit", tone: "primary",
      title: t("Salvar alterações?"),
      message: `${t("Atualizaremos sua autoavaliação no ciclo")} ${cycle.label}. ${t("Você ainda poderá editá-la enquanto o ciclo estiver aberto.")}`,
      confirmLabel: t("Salvar alterações"), cancelLabel: t("Continuar editando"),
    } : {
      icon: "send", tone: "primary",
      title: t("Enviar autoavaliação?"),
      message: `${t("Suas respostas serão registradas no ciclo")} ${cycle.label}. ${t("Você poderá ajustá-las a qualquer momento enquanto o ciclo estiver aberto. Após o encerramento, a avaliação não poderá mais ser alterada.")}`,
      confirmLabel: t("Enviar avaliação"), cancelLabel: t("Continuar editando"),
    });
    if (!ok) return;
    s.submitReview(cycle.id, actor, "self", dims, open, answers);
    go("co_home");
  };
  return (
    <div className="content">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => go("co_home")}><Icon name="chevron" size={15} style={{ transform: "rotate(180deg)" }} />{t("Início")}</button>
      <EvaluationForm cycle={cycle} contractor={me} type="self" existing={existing}
        onCancel={() => go("co_home")}
        onSubmit={handleSubmit} />
    </div>
  );
}

function ContractorHistory({ actor }) {
  const s = useStore();
  const { t } = useLang();
  const me = s.getContractor(actor);
  const cyclesDesc = [...s.cycles].reverse();
  const [cycleId, setCycleId] = React.useState(cyclesDesc[0].id);
  const cycle = s.getCycle(cycleId);

  return (
    <div className="content anim-in">
      <div className="page-head"><div className="eyebrow">{me.name}</div><h2>{t("Meu histórico")}</h2><p>{t("Veja sua auto-avaliação e a avaliação do cliente em cada ciclo. A avaliação do cliente fica disponível após o encerramento do ciclo.")}</p></div>
      <div className="row wrap" style={{ gap: 6, marginBottom: 16 }}>
        {cyclesDesc.map(cy => <button key={cy.id} className={"btn btn-sm " + (cy.id === cycleId ? "btn-primary" : "")} onClick={() => setCycleId(cy.id)}>{cy.label} {cy.status === "open" && "·"}</button>)}
      </div>
      <div className="between" style={{ marginBottom: 14 }}>
        <span className="muted" style={{ fontSize: 13 }}>{t("Ciclo")} {cycle.label} · {fmtBR(cycle.start)} → {fmtBR(cycle.end)}</span>
        <CycleBadge status={cycle.status} />
      </div>
      <ReviewDetail cycle={cycle} contractor={me} perspective="contractor" />
    </div>
  );
}

Object.assign(window, { ContractorHome, Sparkline, ContractorSelfReview, ContractorHistory });
