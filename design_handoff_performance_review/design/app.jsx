// app.jsx — shell, auth gating, language, role switcher, routing, tweaks

const ACTORS = {
  admin: { name: "Marcos Tavares", role: "Gestor de Operações · LeCode", color: "oklch(0.45 0.03 262)" },
};

const ROLES = {
  admin: {
    label: "Gestor LeCode", sub: "Administra a plataforma",
    actor: () => ACTORS.admin,
    home: "a_dashboard",
    nav: [
      { group: "Operação", items: [
        { id: "a_dashboard", label: "Visão geral", icon: "dashboard" },
        { id: "a_cycles", label: "Ciclos de avaliação", icon: "cycle" },
      ] },
      { group: "Cadastros", items: [
        { id: "a_contractors", label: "Contratados", icon: "users", parent: ["a_contractor"] },
        { id: "a_clients", label: "Clientes", icon: "building" },
      ] },
      { group: "Configuração", items: [
        { id: "a_form", label: "Formulário", icon: "form" },
      ] },
    ],
  },
  client: {
    label: "Representante Cliente", sub: "Avalia o time alocado",
    actorId: "c1",
    actor: (s) => { const c = s.getClient("c1"); return { name: c.rep, role: `${c.repRole} · ${c.name}`, color: c.color }; },
    home: "cl_team",
    nav: [
      { group: "Avaliação", items: [
        { id: "cl_team", label: "Minha equipe", icon: "users", parent: ["cl_eval"] },
        { id: "cl_history", label: "Histórico", icon: "history" },
      ] },
    ],
  },
  contractor: {
    label: "Contratado LeCode", sub: "Faz a auto-avaliação",
    actorId: "u1",
    actor: (s) => { const c = s.getContractor("u1"); return { name: c.name, role: c.role, color: c.color }; },
    home: "co_home",
    nav: [
      { group: "Minha avaliação", items: [
        { id: "co_home", label: "Início", icon: "dashboard" },
        { id: "co_self", label: "Auto-avaliação", icon: "form" },
        { id: "co_history", label: "Histórico", icon: "history" },
      ] },
    ],
  },
};

const SCREENS = {
  a_dashboard: AdminDashboard, a_cycles: AdminCycles, a_contractors: AdminContractors,
  a_contractor: ContractorDetail, a_clients: AdminClients, a_form: AdminFormEditor,
  cl_team: ClientTeam, cl_eval: ClientEvaluate, cl_history: ClientHistory,
  co_home: ContractorHome, co_self: ContractorSelfReview, co_history: ContractorHistory,
};

const SCREEN_TITLES = {
  a_dashboard: "Visão geral", a_cycles: "Ciclos de avaliação", a_contractors: "Contratados",
  a_contractor: "Detalhe do contratado", a_clients: "Clientes", a_form: "Formulário de avaliação",
  cl_team: "Minha equipe", cl_eval: "Avaliar colaborador", cl_history: "Histórico",
  co_home: "Início", co_self: "Auto-avaliação", co_history: "Meu histórico",
};

function loadState() {
  try { return JSON.parse(localStorage.getItem("lecode_pr") || "{}"); } catch (e) { return {}; }
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#00b473",
  "theme": "dark",
  "density": "regular"
}/*EDITMODE-END*/;

// relative luminance → pick readable text color on the accent
function inkOnAccent(hex) {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255, g = parseInt(m.slice(2, 4), 16) / 255, b = parseInt(m.slice(4, 6), 16) / 255;
  const lin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? '#0c1411' : '#ffffff';
}

function Root() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => {
    document.documentElement.style.setProperty("--accent", tw.accent);
    document.documentElement.style.setProperty("--ink-on-accent", inkOnAccent(tw.accent));
    document.documentElement.setAttribute("data-theme", tw.theme);
    document.documentElement.setAttribute("data-density", tw.density);
  }, [tw.accent, tw.theme, tw.density]);

  const saved = React.useMemo(loadState, []);
  const [authed, setAuthed] = React.useState(!!saved.authed);
  const [authView, setAuthView] = React.useState("login");

  const onAuth = (r) => {
    localStorage.setItem("lecode_pr", JSON.stringify({ authed: true, role: r, screen: ROLES[r].home }));
    setAuthed(true);
    setBootRole(r);
  };
  const [bootRole, setBootRole] = React.useState(saved.role && ROLES[saved.role] ? saved.role : "admin");
  const onLogout = () => {
    const cur = loadState();
    localStorage.setItem("lecode_pr", JSON.stringify({ ...cur, authed: false }));
    setAuthed(false); setAuthView("login");
  };

  const themeApi = React.useMemo(() => ({
    theme: tw.theme,
    setTheme: (v) => setTweak("theme", v),
    toggle: () => setTweak("theme", tw.theme === "dark" ? "light" : "dark"),
  }), [tw.theme]);

  let body;
  if (!authed) {
    body = authView === "login"
      ? <LoginScreen onAuth={onAuth} onGoSignup={() => setAuthView("signup")} onGoRecover={() => setAuthView("recover")} />
      : authView === "signup"
        ? <SignupScreen onAuth={onAuth} onGoLogin={() => setAuthView("login")} />
        : <RecoverScreen onGoLogin={() => setAuthView("login")} />;
  } else {
    body = <App tw={tw} setTweak={setTweak} bootRole={bootRole} onLogout={onLogout} />;
  }
  return <ThemeContext.Provider value={themeApi}>{body}</ThemeContext.Provider>;
}

function App({ tw, setTweak, bootRole, onLogout }) {
  const s = useStore();
  const { t } = useLang();
  const confirm = useConfirm();
  const askLogout = async () => {
    const ok = await confirm({
      icon: "logout", tone: "primary",
      title: t("Sair da plataforma?"),
      message: t("Você precisará entrar novamente para acessar seus ciclos de avaliação."),
      confirmLabel: t("Sair"), cancelLabel: t("Cancelar"),
    });
    if (ok) onLogout();
  };
  const saved = React.useMemo(loadState, []);
  const PARAM_SCREENS = ["a_contractor", "cl_eval"]; // need params; never restore directly
  const initRole = bootRole && ROLES[bootRole] ? bootRole : "admin";
  const initScreen = saved.screen && SCREENS[saved.screen] && !PARAM_SCREENS.includes(saved.screen) && saved.role === initRole ? saved.screen : ROLES[initRole].home;
  const [role, setRole] = React.useState(initRole);
  const [screen, setScreen] = React.useState(initScreen);
  const [params, setParams] = React.useState({});
  const [roleMenu, setRoleMenu] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem("lecode_pr", JSON.stringify({ authed: true, role, screen }));
  }, [role, screen]);

  const go = (sc, p = {}) => { setScreen(sc); setParams(p); setNavOpen(false); window.scrollTo({ top: 0 }); };
  const switchRole = (r) => { setRole(r); setScreen(ROLES[r].home); setParams({}); setRoleMenu(false); setNavOpen(false); window.scrollTo({ top: 0 }); };

  const cfg = ROLES[role];
  const actor = cfg.actor(s);
  const actorId = cfg.actorId;
  const Screen = SCREENS[screen];
  const initials = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("");

  const activeId = (() => {
    for (const g of cfg.nav) for (const it of g.items) {
      if (it.id === screen) return it.id;
      if (it.parent && it.parent.includes(screen)) return it.id;
    }
    return screen;
  })();

  const navBadge = (id) => {
    if (id === "a_contractors") return s.contractors.length;
    if (id === "a_cycles") { const c = s.activeCycle(); return c ? "•" : null; }
    if (id === "cl_team") {
      const c = s.activeCycle(); if (!c) return null;
      const team = s.contractorsOfClient(actorId);
      const pending = team.filter(x => s.review(c.id, x.id, "client")?.status !== "done").length;
      return pending || null;
    }
    if (id === "co_self") {
      const c = s.activeCycle(); if (!c) return null;
      return s.review(c.id, actorId, "self")?.status === "done" ? null : "•";
    }
    return null;
  };

  return (
    <div className={"app" + (navOpen ? " nav-open" : "")}>
      <div className="nav-backdrop" onClick={() => setNavOpen(false)} />
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><img src={(window.__resources && window.__resources.logo) || "assets/lecode-logo.png"} alt="LeCode" /></div>
          <div className="brand-name">LeCode<small>performance_review</small></div>
        </div>
        {cfg.nav.map(g => (
          <div key={g.group}>
            <div className="nav-group-label">{t(g.group)}</div>
            {g.items.map(it => {
              const b = navBadge(it.id);
              return (
                <button key={it.id} className={"nav-item " + (activeId === it.id ? "active" : "")} onClick={() => go(it.id)}>
                  <Icon name={it.icon} size={18} className="ni-icon" />
                  <span>{t(it.label)}</span>
                  {b != null && <span className="ni-badge">{b}</span>}
                </button>
              );
            })}
          </div>
        ))}
        <div className="sidebar-foot">
          <div className="nav-item" style={{ cursor: "default" }}>
            <span className="avatar sm" style={{ background: actor.color }}>{initials(actor.name)}</span>
            <div className="col" style={{ minWidth: 0, gap: 0 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{actor.name}</span>
              <span className="muted" style={{ fontSize: 11 }}>{t(cfg.label)}</span>
            </div>
            <button className="icon-btn" title={t("Sair")} onClick={askLogout} style={{ marginLeft: "auto" }}><Icon name="logout" size={16} /></button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="nav-toggle" aria-label="Menu" onClick={() => setNavOpen(v => !v)}>
            <Icon name="menu" size={20} />
          </button>
          <h1>{t(SCREEN_TITLES[screen])}</h1>
          <div className="topbar-spacer" />
          <LangToggle />
          <ThemeToggle />
          <div className="role-switch">
            <button className="role-pill" onClick={() => setRoleMenu(v => !v)}>
              <span className="avatar sm" style={{ background: actor.color }}>{initials(actor.name)}</span>
              <div className="col" style={{ alignItems: "flex-start", gap: 0 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{t(cfg.label)}</span>
                <span className="muted" style={{ fontSize: 11, lineHeight: 1.2 }}>{actor.name}</span>
              </div>
              <Icon name="chevronDown" size={15} className="muted" />
            </button>
            {roleMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setRoleMenu(false)} />
                <div className="role-menu">
                  <div className="rm-label">{t("Visualizar como")}</div>
                  {Object.entries(ROLES).map(([k, r]) => {
                    const a = r.actor(s);
                    return (
                      <div key={k} className={"role-opt " + (role === k ? "sel" : "")} onClick={() => switchRole(k)}>
                        <span className="avatar sm" style={{ background: a.color }}>{initials(a.name)}</span>
                        <div className="col" style={{ gap: 0 }}>
                          <span className="ro-name">{t(r.label)}</span>
                          <span className="ro-sub">{a.name} · {t(r.sub)}</span>
                        </div>
                        {role === k && <Icon name="check" size={16} className="muted" style={{ marginLeft: "auto" }} />}
                      </div>
                    );
                  })}
                  <div className="divider" style={{ margin: "6px 0" }} />
                  <div className="role-opt" onClick={askLogout}>
                    <span className="rc-ic" style={{ width: 26, height: 26, borderRadius: 7, background: "var(--surface-3)", color: "var(--ink-2)", display: "grid", placeItems: "center" }}><Icon name="logout" size={15} /></span>
                    <span className="ro-name">{t("Sair")}</span>
                  </div>
                  <div style={{ padding: "6px 10px 4px", fontSize: 11, color: "var(--ink-3)", lineHeight: 1.4 }}>{t("Protótipo — alterne entre perfis para explorar cada jornada.")}</div>
                </div>
              </>
            )}
          </div>
        </header>

        <Screen go={go} params={params} actor={actorId} />
      </div>

      <TweaksPanel>
        <TweakSection label={t("Marca")} />
        <TweakColor label={t("Cor de destaque")} value={tw.accent}
          options={["#00b473", "#10b981", "#2dd4bf", "#3b82f6", "#8b5cf6", "#f59e0b"]}
          onChange={v => setTweak("accent", v)} />
        <TweakSection label={t("Aparência")} />
        <TweakRadio label={t("Tema")} value={tw.theme} options={["light", "dark"]} onChange={v => setTweak("theme", v)} />
        <TweakRadio label={t("Densidade")} value={tw.density} options={["compact", "regular", "comfy"]} onChange={v => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <LangProvider><StoreProvider><ConfirmProvider><Root /></ConfirmProvider></StoreProvider></LangProvider>
);
