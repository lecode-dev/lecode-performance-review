// auth.jsx — Login, Signup, Password recovery (bilingual, validated, LeCode brand)

const AUTH_ROLES = [
  { key: "admin", icon: "building", name: "Gestor LeCode", sub: "Administra a plataforma" },
  { key: "client", icon: "users", name: "Representante Cliente", sub: "Avalia o time alocado" },
  { key: "contractor", icon: "form", name: "Contratado LeCode", sub: "Faz a auto-avaliação" },
];

// Seeded demo accounts — in production each user's role comes from the identity
// provider / DB (profiles.role), never chosen at login. Here we simulate that by
// letting you sign in *as* a pre-provisioned account whose role is fixed.
const DEMO_ACCOUNTS = [
  { role: "admin", name: "Marcos Tavares", email: "marcos@lecode.dev", color: "oklch(0.45 0.03 262)", roleName: "Gestor LeCode" },
  { role: "client", name: "Marina Alves", email: "marina@fintrack.com", color: "oklch(0.55 0.16 264)", roleName: "Representante Cliente" },
  { role: "contractor", name: "Rafael Moreira", email: "rafael@lecode.dev", color: "oklch(0.55 0.16 264)", roleName: "Contratado LeCode" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function pwStrength(pw) {
  if (!pw) return 0;
  let n = 0;
  if (pw.length >= 8) n++;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) n++;
  if (/[^a-zA-Z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) n++;
  return Math.min(3, n);
}

function AuthShell({ children }) {
  const logo = (window.__resources && window.__resources.logo) || "assets/lecode-logo.png";
  const { t, lang } = useLang();
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="auth-brand">
          <img src={logo} alt="LeCode" />
          <div className="col" style={{ gap: 1 }}>
            <span className="ab-name">LeCode</span>
            <span className="ab-sub">performance_review</span>
          </div>
        </div>
        <div className="auth-hero">
          <div className="auth-eyebrow"><span className="lg-dot" />{t("Outsourcing de engenharia · desde 2019")}</div>
          <h2>{t("Desenvolvimento Ágil, Gestão Simplificada.")}</h2>
          <p>{t("Acompanhe seus ciclos de avaliação e seu desenvolvimento ao longo do tempo na LeCode.")}</p>
          <div style={{ marginTop: 26, maxWidth: 380 }}><CodeTerminal lang={lang} /></div>
        </div>
        <div className="auth-foot">© 2026 LeCode, Inc. · Montes Claros · MG · Brasil</div>
      </aside>

      <main className="auth-main">
        <div className="auth-topbar"><LangToggle /><ThemeToggle /></div>
        <div className="auth-card">
          <div className="auth-mark-sm"><img src={logo} alt="LeCode" /><span>LeCode</span></div>
          {children}
        </div>
      </main>
    </div>
  );
}

// ---- reusable validated text field ----
function TextField({ label, type = "text", value, onChange, onBlur, error, touched, placeholder, right }) {
  const show = touched && error;
  return (
    <div className="field">
      <div className="auth-row"><label>{label}</label>{right}</div>
      <input className={"input" + (show ? " err" : "")} type={type} value={value}
        onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} />
      {show && <span className="field-err"><Icon name="warning" />{error}</span>}
    </div>
  );
}

function PasswordField({ label, value, onChange, onBlur, error, touched, placeholder, right }) {
  const { t } = useLang();
  const [vis, setVis] = React.useState(false);
  const show = touched && error;
  return (
    <div className="field">
      <div className="auth-row"><label>{label}</label>{right}</div>
      <div className="pw-wrap">
        <input className={"input" + (show ? " err" : "")} type={vis ? "text" : "password"} value={value}
          onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder || "••••••••"} />
        <button type="button" className="pw-toggle" title={t(vis ? "Ocultar senha" : "Mostrar senha")} onClick={() => setVis(v => !v)}>
          <Icon name={vis ? "eyeOff" : "eye"} size={16} />
        </button>
      </div>
      {show && <span className="field-err"><Icon name="warning" />{error}</span>}
    </div>
  );
}

function StrengthMeter({ value }) {
  const { t } = useLang();
  if (!value) return null;
  const s = pwStrength(value);
  const labels = { 1: t("Fraca"), 2: t("Média"), 3: t("Forte") };
  return (
    <div className="pw-strength">
      <div className="pw-bars">
        {[1, 2, 3].map(i => <span key={i} className={"pw-bar" + (i <= s ? " s" + s : "")} />)}
      </div>
      <span className={"pw-label s" + s}>{t("Força da senha")}: {labels[s] || labels[1]}</span>
    </div>
  );
}

// ---- Login ----
function LoginScreen({ onAuth, onGoSignup, onGoRecover }) {
  const { t } = useLang();
  const [acct, setAcct] = React.useState(DEMO_ACCOUNTS[0]);
  const [f, setF] = React.useState({ email: DEMO_ACCOUNTS[0].email, password: "demo1234" });
  const [touched, setTouched] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);

  const errs = {
    email: !f.email ? t("E-mail é obrigatório") : !EMAIL_RE.test(f.email) ? t("E-mail inválido") : "",
    password: !f.password ? t("Senha é obrigatória") : "",
  };
  const valid = !errs.email && !errs.password;
  const show = (k) => touched[k] || submitted;
  const pick = (a) => { setAcct(a); setF(s => ({ ...s, email: a.email })); };
  const submit = () => { setSubmitted(true); if (valid) onAuth(acct.role); };

  return (
    <AuthShell>
      <h1>{t("Bem-vindo de volta")}</h1>
      <p className="sub">{t("Acesse a plataforma de performance review da LeCode.")}</p>

      <div className="auth-form">
        <TextField label={t("E-mail corporativo")} type="email" placeholder="voce@lecode.dev"
          value={f.email} onChange={v => setF({ ...f, email: v })} onBlur={() => setTouched(s => ({ ...s, email: true }))}
          error={errs.email} touched={show("email")} />
        <PasswordField label={t("Senha")} value={f.password} onChange={v => setF({ ...f, password: v })}
          onBlur={() => setTouched(s => ({ ...s, password: true }))} error={errs.password} touched={show("password")}
          right={<span className="link" onClick={onGoRecover}>{t("Esqueceu a senha?")}</span>} />

        <div className="field">
          <label>{t("Entrar como conta de demonstração")} <span className="muted" style={{ fontWeight: 400 }}>· {t("O perfil é definido pela conta, não escolhido no login.")}</span></label>
          <div className="role-choices">
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.role} type="button" className={"role-choice account " + (acct.role === a.role ? "sel" : "")} onClick={() => pick(a)}>
                <Avatar person={{ name: a.name, color: a.color }} />
                <div className="col" style={{ gap: 1, minWidth: 0 }}>
                  <span className="rc-name">{a.name}</span>
                  <span className="rc-sub">{a.email}</span>
                </div>
                <span className="acct-role"><Icon name="shieldCheck" size={12} />{t(a.roleName)}</span>
              </button>
            ))}
          </div>
          <div className="auth-note"><Icon name="shield" size={13} />{t("No ambiente real, o perfil vem da role da conta no provedor de identidade (Auth0 / Supabase) e é imposto no servidor.")}</div>
        </div>

        <label className="checkbox"><input type="checkbox" defaultChecked />{t("Lembrar de mim")}</label>

        <button className="btn btn-primary btn-block" onClick={submit}>{t("Entrar")}<Icon name="arrowRight" size={16} /></button>
        <div className="auth-or">{t("ou")}</div>
        <button className="btn btn-block" onClick={() => onAuth(acct.role)}><Icon name="lock" size={15} />{t("Continuar com SSO")}</button>
      </div>

      <div className="auth-switch">{t("Não tem conta?")} <span className="link" onClick={onGoSignup}>{t("Cadastre-se")}</span></div>
    </AuthShell>
  );
}

// ---- Signup ----
function SignupScreen({ onAuth, onGoLogin }) {
  const { t } = useLang();
  const [f, setF] = React.useState({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const blur = (k) => setTouched(s => ({ ...s, [k]: true }));

  const errs = {
    name: !f.name.trim() ? t("Nome é obrigatório") : !/\s/.test(f.name.trim()) ? t("Informe nome e sobrenome") : "",
    email: !f.email ? t("E-mail é obrigatório") : !EMAIL_RE.test(f.email) ? t("E-mail inválido") : "",
    password: !f.password ? t("Senha é obrigatória") : f.password.length < 8 ? t("A senha deve ter ao menos 8 caracteres") : "",
    confirm: !f.confirm ? t("Confirme a senha") : f.confirm !== f.password ? t("As senhas não coincidem") : "",
  };
  const valid = !errs.name && !errs.email && !errs.password && !errs.confirm;
  const show = (k) => touched[k] || submitted;
  const submit = () => { setSubmitted(true); if (valid) onAuth("contractor"); };

  return (
    <AuthShell>
      <h1>{t("Crie sua conta")}</h1>
      <p className="sub">{t("Cadastre-se para participar dos ciclos de avaliação.")}</p>

      <div className="auth-form">
        <TextField label={t("Nome completo")} placeholder="Ex.: Rafael Moreira"
          value={f.name} onChange={v => setF({ ...f, name: v })} onBlur={() => blur("name")} error={errs.name} touched={show("name")} />
        <TextField label={t("E-mail corporativo")} type="email" placeholder="voce@lecode.dev"
          value={f.email} onChange={v => setF({ ...f, email: v })} onBlur={() => blur("email")} error={errs.email} touched={show("email")} />
        <div>
          <PasswordField label={t("Senha")} value={f.password} onChange={v => setF({ ...f, password: v })}
            onBlur={() => blur("password")} error={errs.password} touched={show("password")} />
          <StrengthMeter value={f.password} />
        </div>
        <PasswordField label={t("Confirmar senha")} value={f.confirm} onChange={v => setF({ ...f, confirm: v })}
          onBlur={() => blur("confirm")} error={errs.confirm} touched={show("confirm")} />

        <div className="field">
          <label>{t("Perfil inicial")}</label>
          <div className="role-choice assigned">
            <span className="rc-ic"><Icon name="form" size={18} /></span>
            <div className="col" style={{ gap: 1 }}>
              <span className="rc-name">{t("Contratado LeCode")}</span>
              <span className="rc-sub">{t("Faz a auto-avaliação")}</span>
            </div>
            <span className="acct-role"><Icon name="lock" size={11} />{t("Perfil atribuído")}</span>
          </div>
          <div className="auth-note"><Icon name="shield" size={13} />{t("Novos cadastros entram como Contratado. Perfis de Gestor e Representante são atribuídos por um administrador.")}</div>
        </div>

        <button className="btn btn-primary btn-block" onClick={submit}>{t("Criar conta")}<Icon name="arrowRight" size={16} /></button>
        <p className="muted" style={{ fontSize: 11.5, textAlign: "center", lineHeight: 1.5, margin: "4px 0 0" }}>
          {t("Ao continuar, você concorda com os termos de uso e a política de privacidade.")}
        </p>
      </div>

      <div className="auth-switch">{t("Já tem conta?")} <span className="link" onClick={onGoLogin}>{t("Faça login")}</span></div>
    </AuthShell>
  );
}

// ---- Password recovery ----
function RecoverScreen({ onGoLogin }) {
  const { t } = useLang();
  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const err = !email ? t("E-mail é obrigatório") : !EMAIL_RE.test(email) ? t("E-mail inválido") : "";
  const submit = () => { setTouched(true); if (!err) setSent(true); };

  if (sent) {
    return (
      <AuthShell>
        <div className="auth-success">
          <div className="as-ic"><Icon name="mail" size={26} /></div>
          <h1>{t("Link enviado")}</h1>
          <p className="sub" style={{ marginBottom: 4 }}>{t("Enviamos um link de redefinição de senha para")}</p>
          <div className="as-mail">{email}</div>
          <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, maxWidth: "34ch", margin: "0 auto 22px" }}>
            {t("Verifique sua caixa de entrada e a pasta de spam. O link expira em 30 minutos.")}
          </p>
          <button className="btn btn-primary btn-block" onClick={onGoLogin}><Icon name="arrowRight" size={16} style={{ transform: "rotate(180deg)" }} />{t("Voltar ao login")}</button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setSent(false)}>{t("Reenviar e-mail")}</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1>{t("Recupere seu acesso")}</h1>
      <p className="sub">{t("Informe o e-mail da sua conta e enviaremos um link para redefinir a senha.")}</p>

      <div className="auth-form">
        <TextField label={t("E-mail corporativo")} type="email" placeholder="voce@lecode.dev"
          value={email} onChange={setEmail} onBlur={() => setTouched(true)} error={err} touched={touched} />
        <button className="btn btn-primary btn-block" onClick={submit}><Icon name="send" size={15} />{t("Enviar link de recuperação")}</button>
        <button className="btn btn-block" onClick={onGoLogin}><Icon name="chevron" size={15} style={{ transform: "rotate(180deg)" }} />{t("Voltar ao login")}</button>
      </div>
    </AuthShell>
  );
}

Object.assign(window, { LoginScreen, SignupScreen, RecoverScreen, AuthShell });
