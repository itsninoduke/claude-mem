// Pixel-art / 8-bit carousel theme (Super-Mario-style sky, voxel blocks,
// brick ground, pixel fonts). Token = coin motif.
// Output: carousels/markit-pixel/slide-NN.html  (render with render.mjs)

import { writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1350;
const HANDLE = "@ninodirector";

// Embed pixel fonts as data URIs so rendering is deterministic (no CDN dependency).
const FONT_PS = readFileSync(join(__dirname, "fonts/PressStart2P.ttf")).toString("base64");
const FONT_VT = readFileSync(join(__dirname, "fonts/VT323.ttf")).toString("base64");
const FONT_FACE = `
  @font-face{font-family:'Press Start 2P';font-style:normal;font-weight:400;
    src:url(data:font/ttf;base64,${FONT_PS}) format('truetype')}
  @font-face{font-family:'VT323';font-style:normal;font-weight:400;
    src:url(data:font/ttf;base64,${FONT_VT}) format('truetype')}`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- pixel-art helper: grid of chars -> SVG rects ----
function pixelArt(rows, palette, cell = 10) {
  const cols = Math.max(...rows.map((r) => r.length));
  let rects = "";
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      const fill = palette[c];
      if (!fill) continue;
      rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fill}"/>`;
    }
  });
  return `<svg width="${cols * cell}" height="${rows.length * cell}" viewBox="0 0 ${cols * cell} ${rows.length * cell}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${rects}</svg>`;
}

// Coin (= token). Gold with engraving.
function coin(cell = 14) {
  return pixelArt([
    "..oooo..",
    ".oggggo.",
    "oggbbggo",
    "ogbggbgo",
    "ogbggbgo",
    "oggbbggo",
    ".oggggo.",
    "..oooo..",
  ], { o: "#7A5A00", g: "#FFD93B", b: "#E0A415" }, cell);
}

// Pixel cloud.
function cloud(cell = 12) {
  return pixelArt([
    "....ooooo....",
    "..oowwwwwoo..",
    ".owwwwwwwwwo.",
    "owwwwwwwwwwwo",
    ".ooooooooooo.",
  ], { o: "#3A5BBF", w: "#FFFFFF" }, cell);
}

// Brick ground strip across the bottom (bricks + ? blocks).
function ground() {
  const blocks = ["b", "b", "q", "b", "b", "b", "q", "b", "b"];
  let html = "";
  blocks.forEach((t) => {
    html += t === "q"
      ? `<div class="gblock qblock">?</div>`
      : `<div class="gblock brick"></div>`;
  });
  return `<div class="ground">${html}</div>`;
}

function clouds() {
  return `<div class="cloud c1">${cloud(11)}</div>
          <div class="cloud c2">${cloud(8)}</div>
          <div class="cloud c3">${cloud(13)}</div>`;
}

function footer() {
  return `<div class="footer">
    <div class="avatar">N</div>
    <div class="handle">${esc(HANDLE)}</div>
  </div>`;
}

// ---------- slide renderer ----------
function renderSlide(slide, idx, total) {
  let main = "";
  const coinTop = `<div class="coin">${coin(16)}</div>`;

  if (slide.kind === "cover") {
    main = `${coinTop}
      <h1 class="title big">${slide.title}</h1>
      ${slide.subtext ? `<div class="box sub"><p>${slide.subtext}</p></div>` : ""}`;
  } else if (slide.kind === "cta") {
    main = `${coinTop}
      <h2 class="title">${slide.title}</h2>
      ${slide.body ? `<div class="box"><p>${slide.body}</p></div>` : ""}
      <div class="btn">${esc(slide.keyword)}</div>`;
  } else {
    main = `${coinTop}
      ${slide.eyebrow ? `<div class="eyebrow">${slide.eyebrow}</div>` : ""}
      ${slide.title ? `<h2 class="title">${slide.title}</h2>` : ""}
      ${slide.body ? `<div class="box"><p>${slide.body}</p></div>` : ""}
      ${slide.mock || ""}`;
  }

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
  ${FONT_FACE}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px}
  body{background:#6C7CEF;overflow:hidden}
  .slide{position:relative;width:${W}px;height:${H}px;overflow:hidden;
    background:linear-gradient(180deg,#6C7CEF 0%,#7E92F2 45%,#A9CBFF 100%)}
  .cloud{position:absolute;z-index:1;image-rendering:pixelated}
  .c1{top:120px;left:70px}.c2{top:300px;right:90px}.c3{top:210px;left:48%}
  .counter{position:absolute;top:46px;right:48px;z-index:5;background:#fff;color:#222;
    font-family:'Press Start 2P';font-size:24px;padding:16px 20px;border:5px solid #1b1b1b;
    box-shadow:7px 7px 0 rgba(0,0,0,.35)}
  .content{position:relative;z-index:3;height:100%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;text-align:center;padding:120px 70px 230px;gap:34px}
  .coin{image-rendering:pixelated;filter:drop-shadow(5px 5px 0 rgba(0,0,0,.3))}
  .eyebrow{font-family:'Press Start 2P';font-size:24px;color:#FFD93B;
    text-shadow:3px 3px 0 #1b1b1b;letter-spacing:1px;line-height:1.5}
  .title{font-family:'Press Start 2P';color:#fff;line-height:1.32;font-size:46px;
    text-shadow:4px 4px 0 #1b1b1b,-2px -2px 0 #1b1b1b,2px -2px 0 #1b1b1b,-2px 2px 0 #1b1b1b,0 6px 0 rgba(0,0,0,.25)}
  .title.big{font-size:54px;line-height:1.34}
  .title .hl{color:#FFD93B}
  .box{background:#fff;border:6px solid #1b1b1b;box-shadow:9px 9px 0 rgba(0,0,0,.35);
    padding:30px 34px;max-width:880px}
  .box p{font-family:'VT323';font-size:46px;line-height:1.12;color:#23233a}
  .box.sub{background:#1b1b2e;border-color:#0c0c16}
  .box.sub p{color:#fff}
  .box .hl{color:#E0671A;font-weight:bold}
  .box.sub .hl{color:#FFD93B}
  /* coin/token HUD */
  .hud{background:#1b1b2e;border:6px solid #0c0c16;box-shadow:9px 9px 0 rgba(0,0,0,.35);
    padding:30px 34px;max-width:880px;width:100%;display:flex;flex-direction:column;gap:20px}
  .hud .hrow{display:flex;align-items:center;justify-content:space-between;gap:18px;
    font-family:'VT323';font-size:44px;color:#fff}
  .hud .hrow .lbl{display:flex;align-items:center;gap:16px}
  .hud .hrow .val{font-family:'Press Start 2P';font-size:26px;color:#FFD93B}
  .hud .hrow.total{border-top:4px solid #44445e;padding-top:18px;margin-top:4px}
  .hud .hrow.total .val{color:#FF5A3C;font-size:30px}
  .hud .ci{image-rendering:pixelated}
  /* microsoft pixel logo */
  .ms{background:#fff;border:6px solid #1b1b1b;box-shadow:9px 9px 0 rgba(0,0,0,.35);
    padding:34px;max-width:880px;width:100%;display:flex;flex-direction:column;align-items:center;gap:20px}
  .msgrid{display:grid;grid-template-columns:64px 64px;grid-template-rows:64px 64px;gap:8px}
  .msgrid div{border:3px solid #1b1b1b}
  .msword{font-family:'Press Start 2P';font-size:34px;color:#2b2b3a}
  .msconv{font-family:'VT323';font-size:40px;color:#23233a;display:flex;gap:14px;align-items:center;
    border-top:4px solid #e3e3ea;padding-top:18px;width:100%;justify-content:center;flex-wrap:wrap}
  .tag{font-family:'Press Start 2P';font-size:20px;background:#1b1b1b;color:#fff;padding:8px 12px}
  /* power-up list */
  .ups{display:flex;flex-direction:column;gap:22px;max-width:880px;width:100%}
  .ups .up{background:#fff;border:6px solid #1b1b1b;box-shadow:7px 7px 0 rgba(0,0,0,.3);
    padding:24px 28px;display:flex;gap:18px;align-items:flex-start;text-align:left;
    font-family:'VT323';font-size:42px;color:#23233a;line-height:1.1}
  .ups .up .n{font-family:'Press Start 2P';font-size:24px;color:#E0671A;flex:none;margin-top:4px}
  /* terminal */
  .term{background:#0d160d;border:6px solid #1b1b1b;box-shadow:9px 9px 0 rgba(0,0,0,.4);
    padding:28px 30px;max-width:880px;width:100%;text-align:left;
    font-family:'VT323';font-size:34px;line-height:1.25;color:#5BE35B}
  .term .c{color:#5a7a5a}.term .y{color:#FFD93B}.term .w{color:#cfe}
  /* pixel button */
  .btn{font-family:'Press Start 2P';font-size:50px;color:#1b1b1b;background:#FFD93B;
    border:6px solid #1b1b1b;box-shadow:9px 9px 0 rgba(0,0,0,.4);padding:26px 44px;letter-spacing:2px}
  /* ground */
  .ground{position:absolute;left:0;bottom:0;z-index:2;width:${W}px;height:120px;display:flex}
  .gblock{width:120px;height:120px;border:4px solid #1b1b1b}
  .brick{background:#B5651D;
    background-image:linear-gradient(#8B4A12 4px,transparent 4px),
      linear-gradient(90deg,#8B4A12 4px,transparent 4px);
    background-size:60px 40px}
  .qblock{background:#E39B2E;color:#7A4A00;font-family:'Press Start 2P';font-size:54px;
    display:flex;align-items:center;justify-content:center;
    text-shadow:2px 2px 0 #fff3, 0 0 0 #7A4A00}
  /* footer */
  .footer{position:absolute;left:0;bottom:140px;z-index:4;width:${W}px;display:flex;
    align-items:center;justify-content:center;gap:18px}
  .avatar{width:64px;height:64px;background:#1b1b2e;border:5px solid #fff;
    font-family:'Press Start 2P';font-size:28px;color:#FFD93B;display:flex;
    align-items:center;justify-content:center;box-shadow:4px 4px 0 rgba(0,0,0,.35)}
  .handle{font-family:'Press Start 2P';font-size:30px;color:#fff;text-shadow:3px 3px 0 #1b1b1b}
</style></head>
<body><div class="slide">
  ${clouds()}
  <div class="counter">${idx}/${total}</div>
  <div class="content">${main}</div>
  ${footer()}
  ${ground()}
</div></body></html>`;
}

// ---------- deck (MARKIT, pixel-flavored mocks) ----------
const slides = [
  { kind: "cover",
    title: `NO le subas<br>más <span class="hl">PDFs</span><br>a Claude.`,
    subtext: `Te está costando el <span class="hl">70%</span> de tus tokens.` },

  { kind: "std",
    title: `Sueltas<br>un PDF...`,
    body: `Claude lo procesa <span class="hl">entero</span>: formato, tablas rotas, imágenes, relleno. Todo.` },

  { kind: "std",
    eyebrow: `EL NÚMERO QUE<br>NADIE TE DICE`,
    mock: `<div class="hud">
      <div class="hrow"><span class="lbl"><span class="ci">${coin(8)}</span>1 PÁGINA PDF</span><span class="val">1.5K-3K</span></div>
      <div class="hrow"><span class="lbl"><span class="ci">${coin(8)}</span>DOC 20 PÁGS</span><span class="val">70,000</span></div>
      <div class="hrow total"><span class="lbl">ANTES DE PREGUNTAR</span><span class="val">-70,000</span></div>
    </div>` },

  { kind: "std",
    title: `Por eso Claude<br>se te <span class="hl">acaba</span><br>a mitad del día.` },

  { kind: "std",
    eyebrow: `LA SOLUCIÓN`,
    title: `MarkItDown`,
    mock: `<div class="ms">
      <div class="msgrid">
        <div style="background:#F25022"></div><div style="background:#7FBA00"></div>
        <div style="background:#00A4EF"></div><div style="background:#FFB900"></div>
      </div>
      <div class="msword">MICROSOFT</div>
      <div class="msconv"><span class="tag">PDF</span><span class="tag">WORD</span><span class="tag">EXCEL</span>→ .md</div>
    </div>` },

  { kind: "std",
    title: `Pasan<br>2 cosas:`,
    mock: `<div class="ups">
      <div class="up"><span class="n">1</span><span>Bajas tu consumo de tokens hasta 70%.</span></div>
      <div class="up"><span class="n">2</span><span>Claude responde mejor: lo entrenaron con millones de docs en Markdown.</span></div>
    </div>` },

  { kind: "cta",
    title: `¿Cuántos tokens<br>quemas <span class="hl">AHORA</span>?`,
    body: `Comenta y te paso mi prompt calculador.`,
    keyword: `TOKENS` },

  { kind: "std",
    eyebrow: `EL TRUCO QUE<br>NADIE USA`,
    body: `MarkItDown trae <span class="hl">servidor MCP</span>. Lo conectas a Claude Desktop y lo usa solo.`,
    mock: `<div class="term"><span class="c">// claude_desktop_config.json</span><br>{<br>&nbsp;<span class="y">"mcpServers"</span>:{<br>&nbsp;&nbsp;<span class="y">"markitdown"</span>:{<br>&nbsp;&nbsp;&nbsp;<span class="y">"command"</span>:<span class="w">"uvx"</span>,<br>&nbsp;&nbsp;&nbsp;<span class="y">"args"</span>:[<span class="w">"markitdown-mcp"</span>]<br>&nbsp;&nbsp;}<br>&nbsp;}<br>}</div>` },

  { kind: "cta",
    title: `¿Quieres la guía<br>completa?`,
    body: `Escríbelo abajo 👇`,
    keyword: `MARKIT` },
];

// ---------- write ----------
const slug = "markit-pixel";
const outDir = join(__dirname, slug);
try { rmSync(outDir, { recursive: true, force: true }); } catch {}
mkdirSync(outDir, { recursive: true });
const total = slides.length;
const files = [];
slides.forEach((s, i) => {
  const n = String(i + 1).padStart(2, "0");
  writeFileSync(join(outDir, `slide-${n}.html`), renderSlide(s, i + 1, total));
  files.push(`slide-${n}.html`);
});

// merge into manifest so render.mjs picks it up
const mfPath = join(__dirname, "manifest.json");
let mf = [];
try { mf = JSON.parse(readFileSync(mfPath, "utf8")); } catch {}
mf = mf.filter((d) => d.slug !== slug);
mf.push({ slug, total, files, title: "MARKIT — pixel-art theme" });
writeFileSync(mfPath, JSON.stringify(mf, null, 2));
console.log(`built ${slug}: ${total} slides`);
