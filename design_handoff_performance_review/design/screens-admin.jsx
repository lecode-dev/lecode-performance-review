// screens-admin.jsx — Gestor LeCode

function AdminDashboard({ go }) {
  const s = useStore();
  const { t } = useLang();
  const cycle = s.activeCycle();
  const prog = s.cycleProgress(cycle.id);
  const activeContractors = s.contractors.filter(c => c.clientId);
  const lastClosed = s.cycles.filter(c => c.status === "closed").slice(-1)[0];

  // attention: contractors whose last-closed final score needs action
  const attention = activeContractors.map(c => ({ c, score: s.finalScore(lastClosed.id, c.id) }))
    .filter(x => x.score != null).sort((a, b) => a.score - b.score);

  return (
    <div className="content anim-in">
      <div className="page-head">
        <div className="eyebrow">{t("Visão geral")}</div>
        <h2>{t("Olá, Marcos")}</h2>
        <p>{t("Acompanhe o andamento do ciclo de avaliação e as decisões recomendadas para os contratados da LeCode.")}</p>
      </div>

      <div className="grid grid-4 stagger" style={{ marginBottom: 18 }}>
        <Stat label={t("Contratados ativos")} icon="users" value={<CountUp end={activeContractors.length} />} />
        <Stat label={t("Clientes")} icon="building" value={<CountUp end={s.clients.length} />} />
        <Stat label={t("Ciclo atual")} icon="cycle" value={<CountUp end={prog.pct} suffix="" />} unit="%" />
        <Stat label={t("Sem alocação")} icon="warning" value={<CountUp end={s.contractors.filter(c => !c.clientId).length} />} />
      </div>

      <div className="l-split s360">
        <div className="card">
          <div className="card-head">
            <Icon name="cycle" size={16} />
            <div className="col" style={{ gap: 1 }}><h3>{t("Ciclo")} {cycle.label}</h3><span className="sub">{fmtBR(cycle.start)} → {fmtBR(cycle.end)}</span></div>
            <span style={{ marginLeft: "auto" }} className="row"><PhaseBadge cycle={cycle} /><CycleBadge status={cycle.status} /></span>
          </div>
          <div className="card-pad">
            <div style={{ marginBottom: 14 }}><CyclePhases cycle={cycle} compact /></div>
            <div className="between" style={{ marginBottom: 6 }}>
              <span className="muted" style={{ fontSize: 12.5 }}>{t("Avaliações concluídas")}</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{prog.done}/{prog.total}</span>
            </div>
            <Progress pct={prog.pct} />
            <div className="divider" />
            <div className="col" style={{ gap: 10 }}>
              {s.clients.map(cl => {
                const cp = s.cycleProgress(cycle.id, cl.id);
                return (
                  <div key={cl.id} className="between">
                    <div className="row" style={{ gap: 10 }}>
                      <span className="avatar sm" style={{ background: cl.color }}>{cl.name[0]}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{cl.name}</span>
                    </div>
                    <div className="row" style={{ gap: 12, width: 200 }}>
                      <div className="progress" style={{ flex: 1 }}><span style={{ width: cp.pct + "%" }} /></div>
                      <span className="mono muted" style={{ fontSize: 12, width: 40, textAlign: "right" }}>{cp.done}/{cp.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="row" style={{ marginTop: 18, gap: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => go("a_cycles")}><Icon name="cycle" size={15} />{t("Gerenciar ciclo")}</button>
              <button className="btn btn-sm" onClick={() => go("a_contractors")}>{t("Ver contratados")}</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><Icon name="trend" size={16} /><h3>{t("Decisões")} · {lastClosed.label}</h3></div>
          <div className="card-pad col" style={{ gap: 4 }}>
            {attention.slice(0, 5).map(({ c, score }) => (
              <div key={c.id} className="between clickable" style={{ padding: "8px 6px", borderRadius: 8, cursor: "pointer" }}
                onClick={() => go("a_contractor", { id: c.id, cycle: lastClosed.id })}>
                <Person person={c} sub={s.getClient(c.clientId)?.name} />
                <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
                  <ScoreChip value={score} />
                  <DecisionTag score={score} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminContractors({ go }) {
  const s = useStore();
  const { t } = useLang();
  const cycle = s.activeCycle();
  const lastClosed = s.cycles.filter(c => c.status === "closed").slice(-1)[0];
  const [q, setQ] = React.useState("");
  const [modal, setModal] = React.useState(false);

  const list = s.contractors.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: "flex-end" }}>
        <div><div className="eyebrow">{t("Pessoas")}</div><h2>{t("Contratados")}</h2><p>{t("Desenvolvedores e gestores de projeto alocados pela LeCode.")}</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Icon name="plus" size={16} />{t("Novo contratado")}</button>
      </div>

      <div className="card" style={{ marginBottom: 14, padding: "10px 12px" }}>
        <div className="row" style={{ gap: 8 }}>
          <Icon name="search" size={16} className="muted" />
          <input className="input" style={{ border: "none", padding: 4, background: "none" }} placeholder={t("Buscar contratado...")} value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th>{t("Contratado")}</th><th>{t("Senioridade")}</th><th>{t("Cliente")}</th>
            <th className="th-num">{t("Último score")} ({lastClosed.label})</th><th>{t("Recomendação")}</th><th></th>
          </tr></thead>
          <tbody>
            {list.map(c => {
              const score = s.finalScore(lastClosed.id, c.id);
              return (
                <tr key={c.id} className="clickable" onClick={() => go("a_contractor", { id: c.id })}>
                  <td><Person person={c} /></td>
                  <td><Badge>{c.seniority} · {c.track}</Badge></td>
                  <td>{c.clientId ? <div className="row" style={{ gap: 8 }}><span className="avatar sm" style={{ background: s.getClient(c.clientId).color }}>{s.getClient(c.clientId).name[0]}</span><span style={{ fontSize: 13 }}>{s.getClient(c.clientId).name}</span></div> : <Badge kind="pending">{t("sem alocação")}</Badge>}</td>
                  <td className="td-num"><ScoreChip value={score} /></td>
                  <td>{score != null ? <DecisionTag score={score} /> : <span className="muted" style={{ fontSize: 12 }}>—</span>}</td>
                  <td className="td-num"><Icon name="chevron" size={16} className="muted" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal && <NewContractorModal onClose={() => setModal(false)} />}
    </div>
  );
}

function NewContractorModal({ onClose }) {
  const s = useStore();
  const { t } = useLang();
  const [f, setF] = React.useState({ name: "", role: "", seniority: "Pleno", track: "Dev", clientId: "" });
  const save = () => { s.addContractor({ ...f, clientId: f.clientId || null, since: "2026-06" }); onClose(); };
  return (
    <Modal title={t("Cadastrar contratado")} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{t("Cancelar")}</button><button className="btn btn-primary" disabled={!f.name || !f.role} onClick={save}><Icon name="check" size={16} />{t("Cadastrar")}</button></>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="field"><label>{t("Nome completo")}</label><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Rafael Moreira" /></div>
        <div className="field"><label>{t("Cargo")}</label><input className="input" value={f.role} onChange={e => setF({ ...f, role: e.target.value })} placeholder="Ex.: Senior Frontend Engineer" /></div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field"><label>{t("Trilha")}</label><select className="select" value={f.track} onChange={e => setF({ ...f, track: e.target.value })}><option>Dev</option><option>Gestão</option></select></div>
          <div className="field"><label>{t("Senioridade")}</label><select className="select" value={f.seniority} onChange={e => setF({ ...f, seniority: e.target.value })}><option>Júnior</option><option>Pleno</option><option>Sênior</option></select></div>
        </div>
        <div className="field"><label>{t("Vincular a cliente")} <span className="muted">({t("opcional")})</span></label>
          <select className="select" value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })}>
            <option value="">{t("Sem alocação")}</option>
            {s.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

function ContractorDetail({ params, go }) {
  const s = useStore();
  const { t } = useLang();
  const c = s.getContractor(params.id);
  if (!c) { go("a_contractors"); return null; }
  const cyclesDesc = [...s.cycles].reverse();
  const [cycleId, setCycleId] = React.useState(params.cycle || s.activeCycle().id);
  const [allocOpen, setAllocOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const cycle = s.getCycle(cycleId);

  return (
    <div className="content anim-in">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => go("a_contractors")}><Icon name="chevron" size={15} style={{ transform: "rotate(180deg)" }} />{t("Contratados")}</button>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div className="row" style={{ gap: 14 }}>
            <Avatar person={c} size="lg" />
            <div className="col">
              <h2 style={{ margin: 0, fontSize: 21 }}>{c.name}</h2>
              <span className="muted" style={{ fontSize: 13.5 }}>{c.role}</span>
              <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
                <Badge>{c.seniority} · {c.track}</Badge>
                <Badge dot>{c.clientId ? s.getClient(c.clientId).name : t("Sem alocação")}</Badge>
                <Badge>{t("desde")} {c.since}</Badge>
              </div>
            </div>
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn btn-sm" onClick={() => setEditOpen(true)}><Icon name="edit" size={15} />{t("Editar dados")}</button>
            <button className="btn btn-sm" onClick={() => setAllocOpen(true)}><Icon name="link" size={15} />{c.clientId ? t("Realocar") : t("Vincular")}</button>
          </div>
        </div>
      </div>

      {/* Cycle selector */}
      <div className="between" style={{ marginBottom: 14 }}>
        <div className="row wrap" style={{ gap: 6 }}>
          {cyclesDesc.map(cy => (
            <button key={cy.id} className={"btn btn-sm " + (cy.id === cycleId ? "btn-primary" : "")} onClick={() => setCycleId(cy.id)}>
              {cy.label} {cy.status === "open" && "·"}
            </button>
          ))}
        </div>
        <CycleBadge status={cycle.status} />
      </div>

      <ReviewDetail cycle={cycle} contractor={c} perspective="admin" />

      <div style={{ marginTop: 18 }}><ContractorHistoryCard contractor={c} /></div>

      {allocOpen && <AllocModal contractor={c} onClose={() => setAllocOpen(false)} />}
      {editOpen && <EditContractorModal contractor={c} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

function ContractorHistoryCard({ contractor }) {
  const s = useStore();
  const { t } = useLang();
  const entries = s.contractorHistory(contractor.id);
  const fieldMeta = {
    role: { icon: "edit", label: t("Cargo") },
    seniority: { icon: "trend", label: t("Senioridade") },
    track: { icon: "users", label: t("Trilha") },
    allocation: { icon: "link", label: t("Alocação") },
  };
  const fmtDate = (d) => d.split("-").reverse().join("/");
  return (
    <div className="card">
      <div className="card-head"><Icon name="history" size={16} /><h3>{t("Histórico de alterações")}</h3></div>
      <div className="card-pad">
        {entries.length === 0 && <div className="muted" style={{ fontSize: 13 }}>{t("Sem alterações registradas.")}</div>}
        {entries.map((h, i) => {
          const meta = fieldMeta[h.field] || fieldMeta.role;
          return (
            <div key={h.id} className="row" style={{ gap: 13, alignItems: "flex-start", padding: "11px 0", borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, flex: "none", display: "grid", placeItems: "center", background: "var(--surface-3)", color: "var(--ink-2)" }}><Icon name={meta.icon} size={15} /></span>
              <div className="col" style={{ gap: 3, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5 }}>
                  <span style={{ fontWeight: 600 }}>{meta.label}</span>
                  <span className="muted"> · </span>
                  <span style={{ color: "var(--ink-3)" }}>{h.from}</span>
                  <Icon name="arrowRight" size={13} style={{ margin: "0 5px", verticalAlign: "-2px", color: "var(--accent-ink)" }} />
                  <span style={{ fontWeight: 500 }}>{h.to}</span>
                </div>
                {h.note && <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>{h.note}</div>}
              </div>
              <div className="col" style={{ alignItems: "flex-end", gap: 1, flex: "none" }}>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{fmtDate(h.at)}</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{h.by}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditContractorModal({ contractor, onClose }) {
  const s = useStore();
  const { t } = useLang();
  const [f, setF] = React.useState({ name: contractor.name, role: contractor.role, track: contractor.track, seniority: contractor.seniority });
  const save = () => { s.updateContractor(contractor.id, f); onClose(); };
  return (
    <Modal title={t("Editar contratado")} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{t("Cancelar")}</button><button className="btn btn-primary" disabled={!f.name || !f.role} onClick={save}><Icon name="check" size={16} />{t("Salvar alterações")}</button></>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="field"><label>{t("Nome completo")}</label><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label>{t("Cargo")}</label><input className="input" value={f.role} onChange={e => setF({ ...f, role: e.target.value })} placeholder="Ex.: Senior Frontend Engineer" /></div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field"><label>{t("Trilha")}</label><select className="select" value={f.track} onChange={e => setF({ ...f, track: e.target.value })}><option>Dev</option><option>Gestão</option></select></div>
          <div className="field"><label>{t("Senioridade")}</label><select className="select" value={f.seniority} onChange={e => setF({ ...f, seniority: e.target.value })}><option>Júnior</option><option>Pleno</option><option>Sênior</option></select></div>
        </div>
      </div>
    </Modal>
  );
}

function AllocModal({ contractor, onClose }) {
  const s = useStore();
  const { t } = useLang();
  const confirm = useConfirm();
  const [cid, setCid] = React.useState(contractor.clientId || "");
  const save = async () => {
    const changed = cid !== (contractor.clientId || "");
    if (changed && (contractor.clientId || cid)) {
      const removing = !cid;
      const ok = await confirm({
        icon: "link", tone: removing ? "danger" : "primary",
        title: removing ? `${t("Desvincular")} ${contractor.name}?` : `${t("Alterar vínculo")} · ${contractor.name}?`,
        message: removing
          ? `${contractor.name} ${t("deixará de ser avaliado por")} ${s.getClient(contractor.clientId)?.name} ${t("no ciclo em andamento. As avaliações já registradas permanecem no histórico.")}`
          : `${contractor.name} ${t("passará a ser avaliado por")} ${s.getClient(cid)?.name}.`,
        confirmLabel: removing ? t("Desvincular") : t("Salvar vínculo"), cancelLabel: t("Cancelar"),
      });
      if (!ok) return;
    }
    s.setAllocation(contractor.id, cid || null);
    onClose();
  };
  return (
    <Modal title={`${t("Vincular")} ${contractor.name}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{t("Cancelar")}</button><button className="btn btn-primary" onClick={save}><Icon name="check" size={16} />{t("Salvar vínculo")}</button></>}>
      <div className="field"><label>{t("Cliente")}</label>
        <select className="select" value={cid} onChange={e => setCid(e.target.value)}>
          <option value="">{t("Desvincular (sem alocação)")}</option>
          {s.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="callout" style={{ marginTop: 16 }}><Icon name="info" />{t("O contratado só pode ser avaliado por um cliente enquanto estiver vinculado durante um ciclo em andamento.")}</div>
    </Modal>
  );
}

function AdminClients({ go }) {
  const s = useStore();
  const { t } = useLang();
  const [modal, setModal] = React.useState(false);
  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: "flex-end" }}>
        <div><div className="eyebrow">{t("Contas")}</div><h2>{t("Clientes")}</h2><p>{t("Empresas onde os contratados da LeCode estão alocados.")}</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Icon name="plus" size={16} />{t("Novo cliente")}</button>
      </div>
      <div className="grid grid-3">
        {s.clients.map(c => {
          const team = s.contractorsOfClient(c.id);
          return (
            <div className="card card-pad" key={c.id}>
              <div className="row" style={{ gap: 12, marginBottom: 14 }}>
                <span className="avatar lg" style={{ background: c.color }}>{c.name[0]}</span>
                <div className="col"><span style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</span><span className="muted" style={{ fontSize: 12.5 }}>{c.industry}</span></div>
              </div>
              <div className="divider" />
              <div className="between" style={{ fontSize: 12.5 }}><span className="muted">{t("Representante")}</span><span style={{ fontWeight: 500 }}>{c.rep}</span></div>
              <div className="between" style={{ fontSize: 12.5, marginTop: 6 }}><span className="muted">{t("Contratados")}</span><span className="mono" style={{ fontWeight: 600 }}>{team.length}</span></div>
              <div className="row" style={{ marginTop: 12 }}>
                {team.slice(0, 5).map(t => <span key={t.id} className="avatar sm" style={{ background: t.color, marginLeft: -6, border: "2px solid var(--surface)" }}>{t.name[0]}</span>)}
              </div>
            </div>
          );
        })}
      </div>
      {modal && <Modal title={t("Cadastrar cliente")} onClose={() => setModal(false)}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>{t("Cancelar")}</button><button className="btn btn-primary" onClick={() => setModal(false)}><Icon name="check" size={16} />{t("Cadastrar")}</button></>}>
        <div className="col" style={{ gap: 16 }}>
          <div className="field"><label>{t("Nome da empresa")}</label><input className="input" placeholder="Ex.: Fintrack" /></div>
          <div className="field"><label>{t("Segmento")}</label><input className="input" placeholder="Ex.: Fintech · Pagamentos" /></div>
          <div className="grid grid-2" style={{ gap: 14 }}>
            <div className="field"><label>{t("Representante")}</label><input className="input" placeholder="Nome" /></div>
            <div className="field"><label>{t("E-mail do representante")}</label><input className="input" placeholder="email@cliente.com" /></div>
          </div>
        </div>
      </Modal>}
    </div>
  );
}

function AdminCycles() {
  const s = useStore();
  const { t } = useLang();
  const confirm = useConfirm();
  const [openModal, setOpenModal] = React.useState(false);
  const cyclesDesc = [...s.cycles].reverse();

  const askClose = async (cy) => {
    const ok = await confirm({
      icon: "lock", tone: "danger",
      title: `${t("Encerrar ciclo")} ${cy.label}?`,
      message: t("Os scores finais serão consolidados e as avaliações cruzadas (autoavaliação ↔ cliente) ficarão visíveis para todas as partes. Nenhuma avaliação poderá ser alterada após o encerramento."),
      detail: t("Esta ação é definitiva e não pode ser desfeita."),
      confirmLabel: t("Encerrar ciclo"), cancelLabel: t("Cancelar"),
    });
    if (ok) s.closeCycle(cy.id);
  };

  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: "flex-end" }}>
        <div><div className="eyebrow">{t("Avaliações")}</div><h2>{t("Ciclos de avaliação")}</h2><p>{t("Abra janelas de avaliação e encerre-as quando todas as avaliações estiverem concluídas.")}</p></div>
        <button className="btn btn-primary" disabled={!!s.activeCycle()} onClick={() => setOpenModal(true)}><Icon name="plus" size={16} />{t("Abrir ciclo")}</button>
      </div>
      {s.activeCycle() && <div className="callout" style={{ marginBottom: 16 }}><Icon name="info" />{t("Já existe um ciclo em andamento")} ({s.activeCycle().label}). {t("Encerre-o antes de abrir um novo.")}</div>}

      <div className="col" style={{ gap: 14 }}>
        {cyclesDesc.map(cy => {
          const prog = s.cycleProgress(cy.id);
          const canClose = s.canCloseCycle(cy.id);
          return (
            <div className="card card-pad" key={cy.id}>
              <div className="between" style={{ alignItems: "flex-start" }}>
                <div className="row" style={{ gap: 14 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center" }}><Icon name="calendar" size={22} /></span>
                  <div className="col">
                    <div className="row" style={{ gap: 10 }}><span style={{ fontWeight: 600, fontSize: 16 }}>{cy.label}</span><CycleBadge status={cy.status} /><PhaseBadge cycle={cy} /></div>
                    <span className="muted" style={{ fontSize: 12.5 }}>{cy.start} → {cy.end}</span>
                  </div>
                </div>
                {cy.status === "open" && (
                  <button className="btn btn-primary btn-sm" disabled={!canClose} onClick={() => askClose(cy)} title={canClose ? "" : t("Todas as avaliações precisam estar concluídas")}>
                    <Icon name="lock" size={15} />{t("Encerrar ciclo")}
                  </button>
                )}
              </div>
              <div className="divider" />
              <div style={{ marginBottom: 16 }}><CyclePhases cycle={cy} /></div>
              <div className="row" style={{ gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div className="between" style={{ marginBottom: 6 }}><span className="muted" style={{ fontSize: 12 }}>{t("Progresso das avaliações")}</span><span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{prog.done}/{prog.total} · {prog.pct}%</span></div>
                  <Progress pct={prog.pct} />
                </div>
                {cy.status === "open" && !canClose && <span className="badge badge-pending"><Icon name="warning" size={13} />{prog.total - prog.done} {t("pendentes")}</span>}
                {cy.status === "open" && canClose && <span className="badge badge-done"><Icon name="check" size={13} />{t("Pronto para encerrar")}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {openModal && <OpenCycleModal onClose={() => setOpenModal(false)} />}
    </div>
  );
}

function OpenCycleModal({ onClose }) {
  const s = useStore();
  const { t } = useLang();
  const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [month, setMonth] = React.useState("2026-07"); // YYYY-MM
  // Deriva: início = dia 1, fim de envios = dia 15, término = último dia do mês.
  const start = `${month}-01`;
  const submitEnd = `${month}-15`;
  const end = s.lastDayOfMonth(start);
  const [y, m] = month.split("-").map(Number);
  const label = `${MONTHS[m - 1]}/${y}`;
  const fmtD = (d) => d.split("-").reverse().slice(0, 2).join("/");
  return (
    <Modal title={t("Abrir ciclo de avaliação")} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{t("Cancelar")}</button><button className="btn btn-primary" disabled={!month} onClick={() => { s.openCycle(label, start, submitEnd, end); onClose(); }}><Icon name="cycle" size={16} />{t("Abrir ciclo")}</button></>}>
      <div className="col" style={{ gap: 16 }}>
        <div className="field"><label>{t("Mês do ciclo")}</label><input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} /></div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="card card-pad" style={{ padding: 14 }}>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}><Icon name="form" size={15} className="muted" /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{t("Janela de envio")}</span></div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{fmtD(start)} – {fmtD(submitEnd)}</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>2 {t("semanas")}</div>
          </div>
          <div className="card card-pad" style={{ padding: 14 }}>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}><Icon name="trend" size={15} className="muted" /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{t("Apuração e discussão")}</span></div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{fmtD(submitEnd)} – {fmtD(end)}</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>2 {t("semanas")}</div>
          </div>
        </div>
        <div className="callout"><Icon name="info" />{t("Envio das respostas (2 semanas) · apuração e discussão com clientes (2 semanas).")}</div>
      </div>
    </Modal>
  );
}

function AdminFormEditor() {
  const s = useStore();
  const { t } = useLang();
  const confirm = useConfirm();
  const askRemove = async () => {
    await confirm({
      icon: "warning", tone: "danger",
      title: t("Remover pergunta?"),
      message: t("A pergunta será removida do formulário de avaliação. Você pode adicioná-la novamente depois."),
      confirmLabel: t("Remover pergunta"), cancelLabel: t("Cancelar"),
    });
  };
  return (
    <div className="content anim-in">
      <div className="page-head between" style={{ alignItems: "flex-end" }}>
        <div><div className="eyebrow">{t("Configuração")}</div><h2>{t("Formulário de avaliação")}</h2><p>{t("O mesmo formulário é usado na auto-avaliação e na avaliação do cliente. Escala de 1 a 5 em cinco dimensões.")}</p></div>
        <button className="btn btn-primary"><Icon name="check" size={16} />{t("Salvar formulário")}</button>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="card card-pad">
          <div className="row" style={{ gap: 10, marginBottom: 12 }}><Icon name="trend" size={16} className="muted" /><span style={{ fontWeight: 600 }}>{t("Pesos do score final")}</span></div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}><label>{t("Self review")}</label><div className="row" style={{ gap: 8 }}><input className="input" defaultValue="30" style={{ width: 70 }} /><span className="muted">%</span></div></div>
            <div className="field" style={{ flex: 1 }}><label>{t("Review cliente")}</label><div className="row" style={{ gap: 8 }}><input className="input" defaultValue="70" style={{ width: 70 }} /><span className="muted">%</span></div></div>
          </div>
          <div className="mono muted" style={{ fontSize: 12, marginTop: 12 }}>{t("Score = self × 0.30 + cliente × 0.70")}</div>
        </div>
        <div className="card card-pad">
          <div className="row" style={{ gap: 10, marginBottom: 12 }}><Icon name="star" size={16} className="muted" /><span style={{ fontWeight: 600 }}>{t("Escala de notas")}</span></div>
          <div className="col" style={{ gap: 7 }}>
            {SCALE.map(sc => <div key={sc.v} className="row" style={{ gap: 10 }}><span className={"score-chip tier-" + sc.v} style={{ minWidth: 30 }}>{sc.v}</span><span style={{ fontSize: 13 }}>{t(sc.label)}</span></div>)}
          </div>
        </div>
      </div>

      <div className="col" style={{ gap: 16 }}>
        {DIMENSIONS.map(d => (
          <div className="card" key={d.key}>
            <div className="card-head">
              <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 600, fontSize: 13 }}>{d.n}</span>
              <div className="col" style={{ gap: 1 }}><h3>{t(d.label)}</h3><span className="sub">{t(d.desc)}</span></div>
              <span style={{ marginLeft: "auto" }}><Badge>{d.questions.length} {t("perguntas")}</Badge></span>
            </div>
            <div className="card-pad col" style={{ gap: 8 }}>
              {d.questions.map((q, i) => (
                <div key={i} className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                  <span className="mono muted" style={{ fontSize: 11, paddingTop: 11 }}>{d.n}.{i + 1}</span>
                  <input className="input" defaultValue={t(q)} />
                  <button className="icon-btn" title={t("Remover")} onClick={askRemove}><Icon name="x" size={16} /></button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginTop: 4 }}><Icon name="plus" size={15} />{t("Adicionar pergunta")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AdminDashboard, AdminContractors, ContractorDetail, AdminClients, AdminCycles, AdminFormEditor });
