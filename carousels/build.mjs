// Carousel slide generator — "Fórmula 100K / noevarner.ai" style
// Dark topographic canvas, coral spark, Montserrat, slide chrome.
// Produces standalone HTML per slide + a deck index, into carousels/<slug>/.
//
// Usage:  node carousels/build.mjs
// Render: handled by render.mjs (Puppeteer) -> PNG 1080x1350 per slide.

import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- Brand config (swap accent to "#3B82F6" for the electric-blue variant) ----
const BRAND = {
  accent: "#ED7A4E",       // coral / orange spark
  accentSoft: "#F4A47E",
  bg: "#0A0A0F",
  handle: "@formula100k",   // <-- change to your real IG handle
  avatarInitials: "F",      // shown inside the profile chip
};

const W = 1080, H = 1350;

// ---------- helpers ----------
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Topographic contour background: nested wavy closed paths in dark purple.
function topoBg(seed = 1) {
  const cx = 540 + (seed % 2 ? -120 : 120);
  const cy = 470;
  let paths = "";
  const rings = 22;
  for (let i = 0; i < rings; i++) {
    const base = 70 + i * 62;
    const amp = 26 + (i % 3) * 10;
    const phase = (seed * 0.7) + i * 0.45;
    const k = 3 + (i % 3);
    const pts = [];
    const STEP = 12;
    for (let a = 0; a <= 360; a += STEP) {
      const t = (a * Math.PI) / 180;
      const r = base + amp * Math.sin(k * t + phase) + (amp * 0.4) * Math.cos((k + 2) * t - phase);
      const x = (cx + r * Math.cos(t)).toFixed(1);
      const y = (cy + r * Math.sin(t) * 1.18).toFixed(1);
      pts.push(`${x},${y}`);
    }
    const op = (0.30 - i * 0.006).toFixed(3);
    paths += `<polygon points="${pts.join(" ")}" fill="none" stroke="#3A2057" stroke-width="2" opacity="${op}"/>`;
  }
  return `<svg class="topo" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${BRAND.bg}"/>
    <g>${paths}</g>
  </svg>`;
}

// Coral "spark" starburst (12 tapered rays).
function spark(size = 118) {
  let rays = "";
  const cx = 50, cy = 50;
  for (let i = 0; i < 12; i++) {
    const a = (i * 30) * Math.PI / 180;
    const inner = 14;
    const outer = i % 2 === 0 ? 44 : 38;
    const x1 = cx + inner * Math.cos(a), y1 = cy + inner * Math.sin(a);
    const x2 = cx + outer * Math.cos(a), y2 = cy + outer * Math.sin(a);
    rays += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${BRAND.accent}" stroke-width="7.5" stroke-linecap="round"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${rays}</svg>`;
}

// Brush-stroke swoosh (decorative, bottom-right on some slides).
const swoosh = `<svg class="swoosh" width="360" height="120" viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M12,86 C90,40 220,30 348,64" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" opacity="0.92"/>
  <path d="M40,96 C120,70 240,66 320,80" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
</svg>`;

// Footer chrome: profile chip + repost badge, IG handle, speaker icon.
function footer() {
  return `<div class="footer">
    <div class="avatar">
      <span>${esc(BRAND.avatarInitials)}</span>
      <div class="repost">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
      </div>
    </div>
    <div class="handle">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.4" stroke="url(#ig)" stroke-width="2"/><circle cx="12" cy="12" r="4.4" stroke="url(#ig)" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3" fill="url(#ig)"/><defs><linearGradient id="ig" x1="0" y1="0" x2="24" y2="24"><stop offset="0" stop-color="#FEDA77"/><stop offset="0.5" stop-color="#DD2A7B"/><stop offset="1" stop-color="#8134AF"/></linearGradient></defs></svg>
      <span>${esc(BRAND.handle)}</span>
    </div>
    <div class="speaker">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
  </div>`;
}

// ---------- slide renderer ----------
function renderSlide(slide, idx, total, seed) {
  const counter = `<div class="counter">${idx}/${total}</div>`;
  const sparkEl = `<div class="spark">${spark(slide.kind === "cover" ? 132 : 110)}</div>`;

  let body = "";
  if (slide.kind === "cover") {
    body = `
      ${sparkEl}
      <div class="main cover">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        <h1 class="hook">${slide.title}</h1>
        ${slide.subtext ? `<p class="subtext">${slide.subtext}</p>` : ""}
      </div>`;
  } else if (slide.kind === "cta") {
    body = `
      ${sparkEl}
      <div class="main">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        <h2 class="title">${slide.title}</h2>
        ${slide.body ? `<p class="bodytext">${slide.body}</p>` : ""}
        <div class="keyword">${esc(slide.keyword)}</div>
        ${slide.foot ? `<p class="bodytext small">${slide.body2 || slide.foot}</p>` : ""}
      </div>`;
  } else {
    body = `
      ${sparkEl}
      <div class="main">
        ${slide.step ? `<div class="step">${esc(slide.step)}</div>` : ""}
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ""}
        ${slide.title ? `<h2 class="title">${slide.title}</h2>` : ""}
        ${slide.body ? `<p class="bodytext">${slide.body}</p>` : ""}
        ${slide.list ? `<ul class="list">${slide.list.map((li) => `<li>${li}</li>`).join("")}</ul>` : ""}
        ${slide.mock || ""}
      </div>`;
  }

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root{ --accent:${BRAND.accent}; --accent-soft:${BRAND.accentSoft}; }
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px}
  body{font-family:'Montserrat',system-ui,sans-serif;background:${BRAND.bg};color:#fff;overflow:hidden}
  .slide{position:relative;width:${W}px;height:${H}px;overflow:hidden;display:flex;flex-direction:column}
  .topo{position:absolute;inset:0;width:100%;height:100%;z-index:0}
  .vignette{position:absolute;inset:0;z-index:1;background:radial-gradient(120% 80% at 50% 18%, rgba(10,10,15,0) 40%, rgba(10,10,15,0.55) 100%)}
  .content{position:relative;z-index:2;display:flex;flex-direction:column;flex:1;padding:104px 86px 60px}
  .counter{position:absolute;top:48px;right:54px;z-index:3;background:rgba(28,28,34,.92);color:#fff;font-weight:700;font-size:30px;padding:10px 22px;border-radius:30px}
  .spark{display:flex;justify-content:center;margin-bottom:30px}
  .main{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:26px}
  .main.cover{gap:30px}
  .step{font-weight:800;letter-spacing:.18em;font-size:34px;color:#fff;text-transform:uppercase}
  .eyebrow{font-weight:800;letter-spacing:.16em;font-size:30px;color:var(--accent);text-transform:uppercase}
  .hook{font-weight:900;font-size:104px;line-height:.98;letter-spacing:-.02em}
  .hook .hl{color:var(--accent)}
  .title{font-weight:900;font-size:74px;line-height:1.02;letter-spacing:-.015em}
  .title .hl{color:var(--accent)}
  .subtext{font-weight:600;font-size:38px;line-height:1.25;color:#C9C4D6;max-width:840px}
  .subtext .hl{color:var(--accent-soft);font-weight:800}
  .bodytext{font-weight:600;font-size:44px;line-height:1.28;color:#EDEAF4;max-width:880px}
  .bodytext.small{font-size:34px;color:#C9C4D6}
  .bodytext .hl{color:var(--accent);font-weight:800}
  .list{list-style:none;display:flex;flex-direction:column;gap:26px;max-width:880px;width:100%}
  .list li{font-weight:700;font-size:42px;line-height:1.22;text-align:left;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);border-left:6px solid var(--accent);border-radius:18px;padding:30px 34px;color:#fff}
  .list li .hl{color:var(--accent)}
  .keyword{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:64px;letter-spacing:.04em;color:#0A0A0F;background:var(--accent);padding:20px 46px;border-radius:18px;box-shadow:0 14px 40px rgba(237,122,78,.35)}
  /* mock cards */
  .card{background:#fff;color:#15131C;border-radius:26px;padding:40px 42px;width:100%;max-width:860px;box-shadow:0 30px 80px rgba(0,0,0,.45);text-align:left}
  .card .ctitle{font-weight:800;font-size:34px;margin-bottom:22px;display:flex;align-items:center;gap:16px}
  .card .badge{background:#15131C;color:#fff;font-weight:800;font-size:24px;width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center}
  .row{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:34px;padding:18px 0;border-bottom:1px solid #ECE9F1}
  .row:last-child{border-bottom:none}
  .row .num{font-family:'JetBrains Mono',monospace;color:var(--accent);font-weight:700}
  .row.total{font-size:40px;font-weight:900}
  .row.total .num{color:#D24A2A}
  .codecard{background:#15131C;color:#E7E3F0;border-radius:22px;padding:34px 38px;width:100%;max-width:860px;font-family:'JetBrains Mono',monospace;font-size:30px;line-height:1.5;text-align:left;box-shadow:0 30px 80px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.08)}
  .codecard .k{color:#7DD3FC}.codecard .s{color:#86EFAC}.codecard .c{color:#7A748C}
  .clause{display:flex;gap:18px;align-items:flex-start;font-weight:700;font-size:30px;padding:16px 0;border-bottom:1px solid #ECE9F1;text-align:left}
  .clause:last-child{border-bottom:none}
  .dot{flex:none;width:30px;height:30px;border-radius:50%;margin-top:4px}
  .dot.red{background:#EF4444}.dot.amber{background:#F59E0B}.dot.green{background:#22C55E}
  .swoosh{position:absolute;right:40px;bottom:150px;z-index:2}
  .footer{position:relative;z-index:3;display:flex;align-items:center;justify-content:center;gap:18px;height:90px}
  .avatar{position:absolute;left:0;width:78px;height:78px;border-radius:50%;background:linear-gradient(135deg,#2A2535,#4A4159);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:34px;color:#fff;border:2px solid rgba(255,255,255,.18)}
  .repost{position:absolute;right:-6px;bottom:-6px;width:38px;height:38px;border-radius:50%;background:#7C3AED;display:flex;align-items:center;justify-content:center;border:3px solid ${BRAND.bg}}
  .handle{display:flex;align-items:center;gap:14px;font-weight:700;font-size:36px}
  .speaker{position:absolute;right:0;width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.10);display:flex;align-items:center;justify-content:center}
</style></head>
<body><div class="slide">
  ${topoBg(seed)}
  <div class="vignette"></div>
  ${counter}
  <div class="content">
    ${body}
    ${slide.swoosh === false ? "" : swoosh}
    ${footer()}
  </div>
</div></body></html>`;
}

// ---------- deck data ----------
const decks = {
  markit: {
    title: "MARKIT — stop wasting tokens on PDFs",
    slides: [
      { kind: "cover",
        title: `NO le subas más<br><span class="hl">PDFs</span> a Claude.`,
        subtext: `Te está costando el <span class="hl">70%</span> de tus tokens.` },
      { kind: "std",
        title: `Cada vez que sueltas un PDF…`,
        body: `Claude lo procesa <span class="hl">entero</span>: formato, tablas rotas, imágenes, relleno. Todo.` },
      { kind: "std",
        eyebrow: `El número que nadie te dice`,
        mock: `<div class="card">
          <div class="ctitle"><span class="badge">∑</span> Costo real de un PDF</div>
          <div class="row"><span>1 página de PDF</span><span class="num">1,500–3,000 tok</span></div>
          <div class="row"><span>Doc de 20 páginas</span><span class="num">~70,000 tok</span></div>
          <div class="row total"><span>Antes de tu 1ª pregunta</span><span class="num">70,000</span></div>
        </div>` },
      { kind: "std",
        title: `Por eso sientes que Claude<br>se te <span class="hl">acaba</span> a mitad del día.`,
        swoosh: false },
      { kind: "std",
        eyebrow: `La solución`,
        title: `MarkItDown`,
        body: `Gratis. De Microsoft. <span class="hl">+110K</span> estrellas en GitHub.`,
        mock: `<div class="card">
          <div class="ctitle"><span class="badge">→</span> Convierte a Markdown limpio</div>
          <div class="row"><span>PDF · Word · Excel</span><span class="num">→ .md</span></div>
          <div class="row"><span>PPT · imágenes</span><span class="num">→ .md</span></div>
        </div>` },
      { kind: "std",
        title: `Pasan 2 cosas:`,
        list: [
          `<b>1.</b> Bajas tu consumo de tokens <span class="hl">hasta 70%</span>.`,
          `<b>2.</b> Claude responde mejor — lo entrenaron con millones de docs en Markdown.`,
        ] },
      { kind: "cta",
        title: `¿Cuántos tokens estás<br>quemando <span class="hl">AHORA</span>?`,
        body: `Comenta y te paso mi prompt calculador.`,
        keyword: `TOKENS` },
      { kind: "std",
        eyebrow: `El truco que nadie usa`,
        body: `MarkItDown trae <span class="hl">servidor MCP</span>. Lo conectas a Claude Desktop y lo usa solo, cada vez que subes un archivo.`,
        mock: `<div class="codecard"><span class="c">// claude_desktop_config.json</span><br>{<br>&nbsp;&nbsp;<span class="k">"mcpServers"</span>: {<br>&nbsp;&nbsp;&nbsp;&nbsp;<span class="k">"markitdown"</span>: {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="k">"command"</span>: <span class="s">"uvx"</span>,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="k">"args"</span>: [<span class="s">"markitdown-mcp"</span>]<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;}<br>}</div>` },
      { kind: "cta",
        title: `¿Quieres la guía completa<br>para instalarlo?`,
        body: `Escríbelo abajo 👇`,
        keyword: `MARKIT` },
    ],
  },

  legal: {
    title: "LEGAL — agentes legales dentro de Claude",
    slides: [
      { kind: "cover",
        title: `Claude acaba de<br><span class="hl">aniquilar</span> las consultas legales de $300.`,
        subtext: `Uso educativo — no es consejo legal.` },
      { kind: "std",
        body: `Anthropic lanzó <span class="hl">agentes legales</span> especializados: 12 plugins por área del derecho + 20 conexiones a herramientas legales reales.` },
      { kind: "std",
        title: `3 formas de usarlo`,
        body: `desliza →`,
        swoosh: false },
      { kind: "std",
        step: `Forma 1`,
        title: `Revisión de contratos<br>en <span class="hl">30 seg</span>.`,
        mock: `<div class="card">
          <div class="ctitle"><span class="badge">✓</span> contrato_servicios.pdf</div>
          <div class="clause"><span class="dot red"></span><span>Cláusula 7 — penalización ilimitada · <b>riesgo alto</b></span></div>
          <div class="clause"><span class="dot amber"></span><span>Cláusula 4 — plazo de pago a 90 días</span></div>
          <div class="clause"><span class="dot green"></span><span>Email de respuesta listo para enviar</span></div>
        </div>` },
      { kind: "cta",
        title: `¿Necesitas un contrato<br>desde cero?`,
        body: `NDA, acuerdo de servicio, laboral.`,
        keyword: `CONTRATO` },
      { kind: "std",
        step: `Forma 2`,
        title: `Dudas legales con<br>jurisprudencia <span class="hl">REAL</span>.`,
        body: `No inventada. Solo de bases verificadas, con la ley exacta y los precedentes.` },
      { kind: "std",
        eyebrow: `Ojo`,
        title: `Claude no reemplaza<br>a tu abogado.`,
        body: `Pero un abogado que sepa usar IA, <span class="hl">tal vez sí</span>.`,
        swoosh: false },
      { kind: "cta",
        title: `¿Quieres la guía completa<br>paso a paso?`,
        body: `Escríbelo abajo 👇`,
        keyword: `LEGAL` },
    ],
  },
};

// ---------- write files ----------
const manifest = [];
for (const [slug, deck] of Object.entries(decks)) {
  const outDir = join(__dirname, slug);
  try { rmSync(outDir, { recursive: true, force: true }); } catch {}
  mkdirSync(outDir, { recursive: true });
  const total = deck.slides.length;
  const files = [];
  deck.slides.forEach((slide, i) => {
    const n = String(i + 1).padStart(2, "0");
    const html = renderSlide(slide, i + 1, total, i + 1);
    const fname = `slide-${n}.html`;
    writeFileSync(join(outDir, fname), html);
    files.push(fname);
  });
  manifest.push({ slug, total, files, title: deck.title });
  console.log(`built ${slug}: ${total} slides`);
}

writeFileSync(join(__dirname, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("manifest written");
