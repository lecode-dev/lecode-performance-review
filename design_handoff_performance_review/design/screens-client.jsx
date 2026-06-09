// screens-client.jsx — Representante Cliente

function ClientTeam({ actor, go }) {
  const s = useStore();
  const { t } = useLang();
  const client = s.getClient(actor);
  const cycle = s.activeCycle();
  const team = s.contractorsOfClient(actor);

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">{client.name} · {client.industry}</div>
        <h2>{t("Minha equipe")}</h2>
        <p>{t("Contratados da LeCode alocados na")} {client.name}. {cycle ? t("Avalie cada colaborador durante o ciclo em andamento.") : t("Nenhum ciclo em andamento no momento.")}</p>
      </div>

      {cycle && (() => {
        const cp = s.cycleProgress(cycle.id, actor);
        const myDone = team.filter(t => s.review(cycle.id, t.id, "client")?.status === "done").length;
        return (
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="between">
              <div className="row" style={{ gap: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center" }}><Icon name="cycle" size={20} /></span>
                <div className="col"><div className="row" style={{ gap: 10 }}><span style={{ fontWeight: 600 }}>{t("Ciclo")} {cycle.label}</span><CycleBadge status="open" /><PhaseBadge cycle={cycle} /></div><span className="muted" style={{ fontSize: 12.5 }}>{t("envios até")} {fmtBR(cycle.submitEnd || cycle.end)}</span></div>
              </div>
              <div className="col" style={{ alignItems: "flex-end" }}>
                <span className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{myDone}/{team.length}</span>
                <span className="muted" style={{ fontSize: 12 }}>{t("avaliações concluídas")}</span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="card">
        <table className="tbl">
          <thead><tr><th>{t("Colaborador")}</th><th>{t("Senioridade")}</th><th>{t("Minha avaliação")}</th><th>{t("Auto-avaliação")}</th><th></th></tr></thead>
          <tbody>
            {team.map(c => {
              const mine = cycle && s.review(cycle.id, c.id, "client");
              const self = cycle && s.review(cycle.id, c.id, "self");
              const mineDone = mine?.status === "done";
              return (
                <tr key={c.id}>
                  <td><Person person={c} /></td>
                  <td><Badge>{c.seniority} · {c.track}</Badge></td>
                  <td>{!cycle ? <span className="muted" style={{ fontSize: 12 }}>—</span> : mineDone ? <Badge kind="done"><Icon name="check" size={12} />{t("Concluída")} · {fmt(s.dimAvg(mine))}</Badge> : <Badge kind="pending">{t("pendente")}</Badge>}</td>
                  <td>{!cycle ? <span className="muted" style={{ fontSize: 12 }}>—</span> : self?.status === "done" ? <Badge><Icon name="lock" size={11} />{t("enviada")}</Badge> : <Badge kind="pending">{t("pendente")}</Badge>}</td>
                  <td className="td-num">
                    {cycle ? (
                      <button className={"btn btn-sm " + (mineDone ? "" : "btn-primary")} onClick={() => go("cl_eval", { id: c.id })}>
                        {mineDone ? <><Icon name="edit" size={14} />{t("Revisar")}</> : <><Icon name="star" size={14} />{t("Avaliar")}</>}
                      </button>
                    ) : <button className="btn btn-sm" onClick={() => go("cl_history")}>{t("Histórico")}</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="callout" style={{ marginTop: 16 }}><Icon name="lock" />{t("Para evitar viés, você só verá o conteúdo da auto-avaliação do colaborador após o encerramento do ciclo.")}</div>
    </div>
  );
}

function ClientEvaluate({ actor, params, go }) {
  const s = useStore();
  const { t } = useLang();
  const confirm = useConfirm();
  const cycle = s.activeCycle();
  const contractor = s.getContractor(params.id);
  if (!cycle || !contractor) { go("cl_team"); return null; }
  const existing = s.review(cycle.id, contractor.id, "client");
  const isEditing = existing && existing.status === "done";
  const handleSubmit = async (dims, open, answers) => {
    const ok = await confirm(isEditing ? {
      icon: "edit", tone: "primary",
      title: t("Salvar alterações?"),
      message: `${t("Atualizaremos sua avaliação no ciclo")} ${cycle.label}. ${t("Você ainda poderá editá-la enquanto o ciclo estiver aberto.")}`,
      confirmLabel: t("Salvar alterações"), cancelLabel: t("Continuar editando"),
    } : {
      icon: "send", tone: "primary",
      title: t("Enviar avaliação?"),
      message: `${t("Você está avaliando")} ${contractor.name}. ${t("Suas respostas serão registradas no ciclo")} ${cycle.label}. ${t("Você poderá ajustá-las a qualquer momento enquanto o ciclo estiver aberto. Após o encerramento, a avaliação não poderá mais ser alterada.")}`,
      confirmLabel: t("Enviar avaliação"), cancelLabel: t("Continuar editando"),
    });
    if (!ok) return;
    s.submitReview(cycle.id, contractor.id, "client", dims, open, answers);
    go("cl_team");
  };
  return (
    <div className="content">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => go("cl_team")}><Icon name="chevron" size={15} style={{ transform: "rotate(180deg)" }} />{t("Minha equipe")}</button>
      <EvaluationForm cycle={cycle} contractor={contractor} type="client" existing={existing}
        onCancel={() => go("cl_team")}
        onSubmit={handleSubmit} />
    </div>
  );
}

function ClientHistory({ actor, go }) {
  const s = useStore();
  const { t } = useLang();
  const team = s.contractorsOfClient(actor);
  const cyclesDesc = [...s.cycles].reverse();
  const [cycleId, setCycleId] = React.useState(cyclesDesc[0].id);
  const [openId, setOpenId] = React.useState(null);
  const cycle = s.getCycle(cycleId);
  const client = s.getClient(actor);

  if (openId) {
    const c = s.getContractor(openId);
    return (
      <div className="content anim-in">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => setOpenId(null)}><Icon name="chevron" size={15} style={{ transform: "rotate(180deg)" }} />{t("Histórico")}</button>
        <div className="page-head"><div className="eyebrow">{cycle.label}</div><div className="row" style={{ gap: 12 }}><Avatar person={c} size="lg" /><div><h2 style={{ margin: 0, fontSize: 20 }}>{c.name}</h2><span className="muted">{c.role}</span></div></div></div>
        <ReviewDetail cycle={cycle} contractor={c} perspective="client" />
      </div>
    );
  }

  return (
    <div className="content anim-in">
      <div className="page-head"><div className="eyebrow">{client.name}</div><h2>{t("Histórico de avaliações")}</h2><p>{t("Avaliações realizadas pela")} {client.name} {t("e auto-avaliações dos colaboradores vinculados, filtradas por ciclo.")}</p></div>
      <div className="row wrap" style={{ gap: 6, marginBottom: 16 }}>
        {cyclesDesc.map(cy => <button key={cy.id} className={"btn btn-sm " + (cy.id === cycleId ? "btn-primary" : "")} onClick={() => setCycleId(cy.id)}>{cy.label}</button>)}
      </div>

      <div className="card">
        <div className="card-head"><Icon name="history" size={16} /><h3>{t("Ciclo")} {cycle.label}</h3><span style={{ marginLeft: "auto" }}><CycleBadge status={cycle.status} /></span></div>
        <table className="tbl">
          <thead><tr><th>{t("Colaborador")}</th><th className="th-num">{t("Minha avaliação")}</th><th className="th-num">{t("Auto-avaliação")}</th><th className="th-num">{t("Score final")}</th><th></th></tr></thead>
          <tbody>
            {team.map(c => {
              const mine = s.review(cycle.id, c.id, "client");
              const self = s.review(cycle.id, c.id, "self");
              const closed = cycle.status === "closed";
              const final = s.finalScore(cycle.id, c.id);
              return (
                <tr key={c.id} className="clickable" onClick={() => setOpenId(c.id)}>
                  <td><Person person={c} /></td>
                  <td className="td-num"><ScoreChip value={mine?.status === "done" ? s.dimAvg(mine) : null} /></td>
                  <td className="td-num">{closed ? <ScoreChip value={self?.status === "done" ? s.dimAvg(self) : null} /> : <Badge><Icon name="lock" size={11} /></Badge>}</td>
                  <td className="td-num">{closed ? <ScoreChip value={final} /> : <span className="muted" style={{ fontSize: 12 }}>{t("após encerrar")}</span>}</td>
                  <td className="td-num"><Icon name="chevron" size={16} className="muted" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {cycle.status !== "closed" && <div className="callout" style={{ marginTop: 16 }}><Icon name="lock" />{t("As auto-avaliações e o score final deste ciclo só ficam visíveis após o encerramento pelo gestor da LeCode.")}</div>}
    </div>
  );
}

Object.assign(window, { ClientTeam, ClientEvaluate, ClientHistory });
