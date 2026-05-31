"use client";
import { useState } from "react";

const PRODUCT = "RAGAI";
const DEMO_URL = "https://demo.ragai.wikolabs.com";

const PAL = {
  bg: "#14122B",
  bg2: "#1E1A3D",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.09)",
  txt1: "#E8E4FC",
  txt2: "#9890B8",
  txt3: "#605880",
  accent: "#8B5CF6",
  accentSoft: "rgba(139,92,246,0.12)",
  accentBorder: "rgba(139,92,246,0.30)",
  navBg: "rgba(20,18,43,0.82)",
};

const IS_DARK = true;

export default function DemoPage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = lang === "fr" ? {
    back: "Retour", title: "Demo", sub: "Demo interactive de " + PRODUCT,
    desc: "L'environnement de demonstration se charge ci-dessous. La demo peut etre construite sur une stack distincte (Python, Streamlit, etc.) et embarquee ici.",
    placeholderTag: "Demo ici",
    placeholderTxt: "L'app demo est en cours de deploiement.",
    placeholderUrl: "URL cible :",
    contact: "Reserver un appel pour une demo guidee",
  } : {
    back: "Back", title: "Demo", sub: PRODUCT + " interactive demo",
    desc: "The demo environment loads below. The demo may run on a separate stack (Python, Streamlit, etc.) and is embedded here.",
    placeholderTag: "Demo here",
    placeholderTxt: "The demo app is being deployed.",
    placeholderUrl: "Target URL:",
    contact: "Book a call for a guided demo",
  };

  return (
    <div style={{ minHeight: "100vh", background: PAL.bg, color: PAL.txt1, display: "flex", flexDirection: "column" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        @media (max-width: 768px) {
          .demo-section { padding: 20px !important; }
          .demo-iframe-wrap { height: 60vh !important; }
        }
      `}</style>

      <nav className="demo-section" style={{ padding: "16px 40px", borderBottom: `1px solid ${PAL.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: PAL.navBg, backdropFilter: "blur(20px)" }}>
        <a href="/" style={{ color: PAL.accent, textDecoration: "none", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}>
          ← {t.back} {PRODUCT}<span style={{ color: PAL.accent }}>.</span>
        </a>
        <div style={{ display: "inline-flex", border: `1px solid ${PAL.border}`, borderRadius: 100, padding: 2, background: PAL.surface }}>
          <button onClick={() => setLang("fr")} style={{ background: lang === "fr" ? PAL.accent : "transparent", color: lang === "fr" ? (IS_DARK ? "#04080F" : "#FFFFFF") : PAL.txt2, border: "none", padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, cursor: "pointer", borderRadius: 100, fontFamily: "inherit" }}>FR</button>
          <button onClick={() => setLang("en")} style={{ background: lang === "en" ? PAL.accent : "transparent", color: lang === "en" ? (IS_DARK ? "#04080F" : "#FFFFFF") : PAL.txt2, border: "none", padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, cursor: "pointer", borderRadius: 100, fontFamily: "inherit" }}>EN</button>
        </div>
      </nav>

      <section className="demo-section" style={{ padding: "48px 40px 24px", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18, background: PAL.accentSoft, border: `1px solid ${PAL.accentBorder}`, borderRadius: 100, padding: "5px 14px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: PAL.accent }} />
          <span style={{ color: PAL.accent, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{t.placeholderTag}</span>
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
          {t.title} · <em style={{ fontStyle: "italic", color: PAL.accent }}>{PRODUCT}</em>
        </h1>
        <p style={{ color: PAL.txt2, fontSize: "1rem", lineHeight: 1.7, maxWidth: 720, margin: "0 0 8px" }}>{t.sub}</p>
        <p style={{ color: PAL.txt3, fontSize: "0.85rem", lineHeight: 1.6, maxWidth: 720, margin: 0 }}>{t.desc}</p>
      </section>

      <section className="demo-section" style={{ padding: "0 40px 40px", maxWidth: 1280, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="demo-iframe-wrap" style={{ position: "relative", flex: 1, minHeight: 520, height: "70vh", background: PAL.bg2, border: `1px solid ${PAL.border}`, borderRadius: 18, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center", zIndex: 1, pointerEvents: "none" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px dashed ${PAL.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: PAL.accent, fontSize: 22 }}>✨</div>
            <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "1.4rem", color: PAL.txt1 }}>{t.placeholderTag}</div>
            <div style={{ color: PAL.txt2, fontSize: "0.88rem", maxWidth: 480 }}>{t.placeholderTxt}</div>
            <code style={{ color: PAL.txt3, fontSize: "0.72rem", fontFamily: "monospace", background: PAL.surface, padding: "4px 10px", borderRadius: 6, border: `1px solid ${PAL.border}` }}>{t.placeholderUrl} {DEMO_URL}</code>
          </div>
          <iframe src={DEMO_URL} title={PRODUCT + " demo"} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, background: "transparent", opacity: 0.0 }} />
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <button data-cal-link="wikolabs-team/30min" data-cal-namespace="wk30min" data-cal-config='{"layout":"month_view"}'
            style={{ background: PAL.accent, color: IS_DARK ? "#04080F" : "#FFFFFF", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            📅 {t.contact}
          </button>
        </div>
      </section>
    </div>
  );
}
