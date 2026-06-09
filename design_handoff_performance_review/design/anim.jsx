// anim.jsx — programming-style interaction animations

const REDUCED = typeof window !== "undefined" && window.matchMedia
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- count-up number animation ----
function useCountUp(target, { duration = 750, delay = 0 } = {}) {
  const [v, setV] = React.useState(REDUCED ? target : 0);
  React.useEffect(() => {
    if (target == null) { setV(null); return; }
    if (REDUCED) { setV(target); return; }
    let raf, to, start;
    const tick = (now) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setV(target * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    to = setTimeout(() => { raf = requestAnimationFrame(tick); }, delay);
    const safety = setTimeout(() => setV(target), delay + duration + 120);
    return () => { clearTimeout(to); clearTimeout(safety); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return v;
}

function CountUp({ end, decimals = 0, duration = 750, suffix = "" }) {
  const v = useCountUp(end, { duration });
  if (v == null) return <span>—</span>;
  return <span>{v.toFixed(decimals)}{suffix}</span>;
}

// ---- typewriter terminal (login aside) ----
function CodeTerminal({ lang }) {
  const SCRIPT = [
    { p: "$", t: 'lecode review open --cycle "Jul/2026"' },
    { o: lang === "en" ? "→ window open · 14 reviews pending" : "→ janela aberta · 14 avaliações pendentes" },
    { p: "$", t: "lecode score --self 0.30 --client 0.70" },
    { o: lang === "en" ? "→ consolidating final scores · ok" : "→ consolidando scores finais · ok" },
    { o: lang === "en" ? "→ promotion-eligible: 2" : "→ elegíveis a promoção: 2", ok: true },
  ];
  const [done, setDone] = React.useState([]); // completed lines
  const [cur, setCur] = React.useState(0);     // current line index
  const [typed, setTyped] = React.useState(""); // chars typed of current command

  React.useEffect(() => { setDone([]); setCur(0); setTyped(""); }, [lang]);

  React.useEffect(() => {
    if (REDUCED) { setDone(SCRIPT); setCur(SCRIPT.length); return; }
    if (cur >= SCRIPT.length) {
      const r = setTimeout(() => { setDone([]); setCur(0); setTyped(""); }, 3600);
      return () => clearTimeout(r);
    }
    const line = SCRIPT[cur];
    if (line.o) { // output line: appear after a beat
      const to = setTimeout(() => { setDone(d => [...d, line]); setCur(c => c + 1); }, 520);
      return () => clearTimeout(to);
    }
    // command line: type char by char
    if (typed.length < line.t.length) {
      const to = setTimeout(() => setTyped(line.t.slice(0, typed.length + 1)), 38 + Math.random() * 36);
      return () => clearTimeout(to);
    }
    const to = setTimeout(() => { setDone(d => [...d, line]); setCur(c => c + 1); setTyped(""); }, 360);
    return () => clearTimeout(to);
  }, [cur, typed, lang]);

  const typingCmd = cur < SCRIPT.length && SCRIPT[cur].p;

  return (
    <div className="terminal">
      <div className="terminal-bar">
        <span className="dot" style={{ background: "#ff5f57" }} />
        <span className="dot" style={{ background: "#febc2e" }} />
        <span className="dot" style={{ background: "#28c840" }} />
        <span className="tb-title">~/lecode/performance · zsh</span>
      </div>
      <div className="terminal-body">
        {done.map((l, i) => (
          <div key={i} className="t-line">
            {l.p ? <span><span className="t-prompt">{l.p}</span>{l.t}</span>
              : <span className={l.ok ? "t-ok" : "t-out"}>{l.t}</span>}
          </div>
        ))}
        {typingCmd && (
          <div className="t-line"><span className="t-prompt">{SCRIPT[cur].p}</span>{typed}<span className="caret" /></div>
        )}
        {!typingCmd && cur < SCRIPT.length && <span className="caret" />}
      </div>
    </div>
  );
}

Object.assign(window, { useCountUp, CountUp, CodeTerminal });
