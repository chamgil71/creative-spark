#!/usr/bin/env node
/**
 * Standalone Builder
 *
 * src/data/guides.json + public/guides/*.html + public/vibecoding/*.html
 * 을 단일 HTML 파일로 묶어 public/standalone.html 로 출력합니다.
 *
 * - 카테고리(categories): guides.json의 메타에 따라 슬러그 → 파일 매핑
 * - 시리즈(collections): folder 안의 indexFile을 파싱해 part 목록 자동 추출
 *
 * 사용:
 *   node scripts/build-standalone.mjs                  # public/standalone.html
 *   node scripts/build-standalone.mjs dist/standalone.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const DATA_FILE = path.join(ROOT, "src/data/guides.json");
const OUT = process.argv[2] || path.join(PUBLIC, "standalone.html");

// ---------- helpers ----------
function readGuideHtml(file) {
  const fp = file.includes("/") ? path.join(PUBLIC, file) : path.join(PUBLIC, "guides", file);
  if (!fs.existsSync(fp)) {
    console.warn(`  ⚠️  missing: ${fp}`);
    return null;
  }
  const raw = fs.readFileSync(fp, "utf8");
  const $ = load(raw);
  // remove inter-page navigation that doesn't make sense in standalone
  $("script").remove();
  $(".back-top, #backTop").remove();
  $("footer").remove();
  const styles = $("style").map((_, el) => $(el).html()).get().join("\n");
  $("style").remove();
  const body = $("body").html() || "";
  return { styles, body };
}

function readCollectionParts(folder, indexFile) {
  // Auto-discover all *.html in the folder (excluding the index file).
  // Title is taken from <title>...</title>, sorted by filename.
  const dir = path.join(PUBLIC, folder);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".html") && f !== indexFile)
    .sort();
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const m = raw.match(/<title>([^<]+)<\/title>/i);
    const title = (m ? m[1].split(/[—\-|]/)[0] : file.replace(/\.html$/, "")).trim();
    return { slug: file.replace(/\.html$/, ""), title, file };
  });
}

function readCollectionHtml(folder, file) {
  const fp = path.join(PUBLIC, folder, file);
  if (!fs.existsSync(fp)) return null;
  const $ = load(fs.readFileSync(fp, "utf8"));
  $("script").remove();
  $(".back-top, #backTop").remove();
  $("footer").remove();
  const styles = $("style").map((_, el) => $(el).html()).get().join("\n");
  $("style").remove();
  const body = $("body").html() || "";
  return { styles, body };
}

// ---------- gather ----------
const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

console.log("📦 Building standalone.html");
console.log(`   data: ${path.relative(ROOT, DATA_FILE)}`);
console.log(`   out:  ${path.relative(ROOT, OUT)}`);

const guideContents = {};
for (const cat of data.categories) {
  for (const g of cat.guides) {
    const c = readGuideHtml(g.file);
    if (c) guideContents[g.slug] = c;
  }
}

const collectionContents = {};
const collectionsOut = [];
for (const col of data.collections || []) {
  const parts = readCollectionParts(col.folder, col.indexFile);
  // include the index itself as the first "part"
  const indexPart = {
    slug: col.indexFile.replace(/\.html$/, ""),
    title: "목차",
    file: col.indexFile,
  };
  const allParts = [indexPart, ...parts];
  const contents = {};
  for (const p of allParts) {
    const c = readCollectionHtml(col.folder, p.file);
    if (c) contents[p.slug] = c;
  }
  collectionContents[col.id] = contents;
  collectionsOut.push({ ...col, parts: allParts });
  console.log(`   📚 collection ${col.id}: ${allParts.length} parts`);
  // Emit a manifest.json next to the collection so the React runtime
  // can list parts without having to parse the index page.
  const manifestPath = path.join(PUBLIC, col.folder, "manifest.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ id: col.id, label: col.label, parts: allParts }, null, 2),
    "utf8",
  );
}

const APP_DATA = {
  categories: data.categories.map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    color: c.color || "#6366f1",
    guides: c.guides,
  })),
  collections: collectionsOut,
  guideContents,
  collectionContents,
};

// ---------- shell HTML ----------
const SHELL = `<!doctype html>
<html lang="ko" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>AI 가이드 허브 (오프라인)</title>
<style>
  html[data-theme="dark"]{--bg:#0b0d12;--panel:#11141b;--panel-2:#161a23;--border:#222836;--fg:#e6e8ee;--muted:#8a93a6;--accent:#6366f1;--main-bg:#fff;--main-fg:#111;--footer-bg:#fafafa;--footer-border:#eee;--footer-btn-bg:#fff;--footer-btn-border:#ddd;--footer-btn-hover:#f0f0f0;}
  html[data-theme="light"]{--bg:#f7f8fb;--panel:#ffffff;--panel-2:#f0f2f7;--border:#e3e6ee;--fg:#1a1d24;--muted:#5b6473;--accent:#6366f1;--main-bg:#fff;--main-fg:#111;--footer-bg:#fafafa;--footer-border:#eee;--footer-btn-bg:#fff;--footer-btn-border:#ddd;--footer-btn-hover:#f0f0f0;}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:var(--bg);color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Pretendard","Noto Sans KR",sans-serif;}
  a{color:inherit}
  .sa-header{height:53px;background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);}
  .sa-bar{display:flex;align-items:center;gap:12px;padding:12px 20px;}
  .sa-bar h1{font-size:16px;margin:0;font-weight:700}
  .sa-crumb{color:var(--muted);font-size:14px}
  .sa-bar button{background:var(--panel-2);color:var(--fg);border:1px solid var(--border);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:13px}
  .sa-bar button:hover{background:color-mix(in srgb,var(--panel-2) 70%,var(--accent) 10%)}
  .sa-toolbar{display:flex;gap:8px;margin-left:auto}
  .sa-layout{display:grid;grid-template-columns:280px minmax(0,1fr);height:calc(100vh - 53px);min-height:0;}
  .sa-sidebar{border-right:1px solid var(--border);background:var(--panel);overflow-y:auto;min-height:0;}
  .sa-cat{padding:12px 16px 4px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:8px}
  .sa-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto}
  .sa-nav a,.sa-nav button{display:block;width:100%;text-align:left;padding:6px 16px 6px 32px;font-size:14px;line-height:1.45;color:var(--muted);text-decoration:none;cursor:pointer;background:none;border:none;font-family:inherit}
  .sa-nav a:hover,.sa-nav button:hover{background:var(--panel-2);color:var(--fg)}
  .sa-nav a.active,.sa-nav button.active{background:var(--panel-2);color:var(--fg);font-weight:600;border-left:3px solid var(--accent);padding-left:29px}
  #main.sa-main{overflow-y:auto;min-height:0;background:var(--main-bg);color:var(--main-fg);}
  .sa-home{padding:40px 32px;background:var(--bg);color:var(--fg);min-height:100%}
  .sa-home h2{font-size:28px;margin:0 0 8px}
  .sa-home p.sa-lead{color:var(--muted);margin:0 0 32px}
  .sa-cat-block{margin-bottom:32px}
  .sa-cat-block h3{font-size:18px;margin:0 0 12px;display:flex;align-items:center;gap:8px}
  .sa-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
  .sa-card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:16px;cursor:pointer;transition:transform .15s,border-color .15s}
  .sa-card:hover{transform:translateY(-2px);border-color:var(--accent)}
  .sa-card .sa-t{font-weight:600;margin-bottom:4px}
  .sa-card .sa-s{color:var(--muted);font-size:13px}
  .sa-guide-wrap{min-height:calc(100% - 66px);background:transparent;color:inherit}
  .sa-guide-host{display:block}
  .sa-message{padding:24px 32px;max-width:1100px;margin:0 auto}
  .sa-footer-nav{display:flex;justify-content:space-between;gap:16px;padding:16px 32px;border-top:1px solid var(--footer-border);background:var(--footer-bg)}
  .sa-footer-nav button{background:var(--footer-btn-bg);border:1px solid var(--footer-btn-border);padding:8px 14px;border-radius:8px;cursor:pointer;color:#111}
  .sa-footer-nav button:hover{background:var(--footer-btn-hover)}
  @media (max-width:800px){.sa-layout{grid-template-columns:1fr}.sa-sidebar{display:none}}
  @media print{
    html,body{height:auto;overflow:visible;background:#fff;color:#000}
    .sa-header,.sa-sidebar,.sa-footer-nav{display:none!important}
    .sa-layout{display:block;height:auto;min-height:0}
    #main.sa-main{display:block;overflow:visible;height:auto;max-height:none;background:#fff;color:#000}
    .sa-guide-wrap{min-height:0;background:transparent;color:inherit}
    .sa-guide-host{display:block}
  }
</style>
</head>
<body>
<header class="sa-header">
  <div class="sa-bar">
    <button id="homeBtn">🏠 홈</button>
    <h1>AI 가이드 허브</h1>
    <span class="sa-crumb" id="crumb"></span>
    <div class="sa-toolbar">
      <button id="themeBtn" title="테마 전환">☀️ 라이트</button>
      <button id="printBtn" style="display:none">🖨 인쇄 / PDF</button>
    </div>
  </div>
</header>
<div class="sa-layout">
  <aside class="sa-sidebar" id="sidebar"></aside>
  <main class="sa-main" id="main"></main>
</div>

<script id="appdata" type="application/json">__APP_DATA__</script>
<script>
const DATA = JSON.parse(document.getElementById('appdata').textContent);
const main = document.getElementById('main');
const sidebar = document.getElementById('sidebar');
const crumb = document.getElementById('crumb');
const printBtn = document.getElementById('printBtn');
const themeBtn = document.getElementById('themeBtn');
const homeBtn = document.getElementById('homeBtn');
let currentShadow = null;

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]))}

function normalizeTheme(value){return value==='dark'?'dark':'light'}

function applyTheme(theme){
  const next = normalizeTheme(theme);
  document.documentElement.dataset.theme = next;
  themeBtn.textContent = next==='dark'?'🌙 다크':'☀️ 라이트';
}

try {
  applyTheme(localStorage.getItem('standalone-theme') || 'light');
} catch (_) {
  applyTheme('light');
}

themeBtn.addEventListener('click',()=>{
  const next = document.documentElement.dataset.theme==='dark'?'light':'dark';
  applyTheme(next);
  try { localStorage.setItem('standalone-theme', next); } catch (_) {}
});

function renderSidebar(activeKey){
  let html = '<div class="sa-nav">';
  for(const c of DATA.categories){
    html += '<div class="sa-cat"><span class="sa-dot" style="background:'+c.color+'"></span>'+escapeHtml(c.label)+'</div>';
    for(const g of c.guides){
      const cls = activeKey==='guide:'+g.slug?'active':'';
      html += '<a class="'+cls+'" data-key="guide:'+g.slug+'">'+escapeHtml(g.title)+'</a>';
    }
  }
  for(const col of DATA.collections){
    html += '<div class="sa-cat"><span class="sa-dot" style="background:'+col.color+'"></span>'+escapeHtml(col.label)+'</div>';
    for(const p of col.parts){
      const key = 'col:'+col.id+':'+p.slug;
      const cls = activeKey===key?'active':'';
      html += '<a class="'+cls+'" data-key="'+key+'">'+escapeHtml(p.title)+'</a>';
    }
  }
  html += '</div>';
  sidebar.innerHTML = html;
  sidebar.querySelectorAll('a[data-key]').forEach(el=>el.addEventListener('click',()=>route(el.dataset.key)));
}

function showHome(){
  currentShadow = null;
  crumb.textContent=''; printBtn.style.display='none';
  let html = '<div class="sa-home"><h2>AI 가이드 허브</h2><p class="sa-lead">필요한 도구를 골라 빠르게 익히세요. 인터넷 없이 작동합니다.</p>';
  for(const c of DATA.categories){
    html += '<div class="sa-cat-block"><h3><span class="sa-dot" style="background:'+c.color+'"></span>'+escapeHtml(c.label)+'</h3><div class="sa-cards">';
    for(const g of c.guides){
      html += '<div class="sa-card" data-key="guide:'+g.slug+'"><div class="sa-t">'+escapeHtml(g.title)+'</div><div class="sa-s">'+escapeHtml(g.subtitle)+'</div></div>';
    }
    html += '</div></div>';
  }
  if(DATA.collections.length){
    html += '<h2 style="margin-top:40px">시리즈 가이드</h2>';
    for(const col of DATA.collections){
      html += '<div class="sa-cat-block"><h3><span class="sa-dot" style="background:'+col.color+'"></span>'+escapeHtml(col.label)+'</h3><div class="sa-cards">';
      for(const p of col.parts){
        html += '<div class="sa-card" data-key="col:'+col.id+':'+p.slug+'"><div class="sa-t">'+escapeHtml(p.title)+'</div></div>';
      }
      html += '</div></div>';
    }
  }
  html += '</div>';
  main.innerHTML = html;
  main.querySelectorAll('.sa-card').forEach(el=>el.addEventListener('click',()=>route(el.dataset.key)));
  renderSidebar(null);
}

function normalizeGuideStyles(css){
  return String(css || '')
    .replace(/(^|[,{}])\\s*:root\\b/gm, '$1:host')
    .replace(/(^|[,{}])\\s*html\\b/gm, '$1:host')
    .replace(/(^|[,{}])\\s*body\\b/gm, '$1.guide-document');
}

function renderShadowContent(host, content){
  currentShadow = host.attachShadow({mode:'open'});
  const baseCss = [
    ':host{display:block;background:transparent;color:inherit;}',
    '.guide-document{display:block;min-height:100%;background:var(--bg,#fff);color:var(--text,#111);}',
    '.guide-document *{box-sizing:border-box;}',
    '@media print{:host{display:block;background:transparent!important;color:inherit!important}.guide-document{min-height:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.nav,.back-top,#backTop{display:none!important}}',
  ].join('\\n');
  currentShadow.innerHTML = '<style>'+baseCss+'\\n'+normalizeGuideStyles(content.styles)+'</style><div class="guide-document">'+content.body+'</div>';
  currentShadow.addEventListener('click',(event)=>{
    const path = event.composedPath();
    const link = path.find((node)=>node && node.tagName === 'A' && node.getAttribute);
    if(!link) return;
    const href = link.getAttribute('href') || '';
    if(href.startsWith('#')){
      event.preventDefault();
      const id = decodeURIComponent(href.slice(1));
      const target = id ? currentShadow.getElementById(id) : currentShadow.getElementById('top');
      if(target) main.scrollTo({top:target.offsetTop,behavior:'smooth'});
      else main.scrollTo({top:0,behavior:'smooth'});
    }
  });
}

function flatNav(){
  const all = [];
  for(const c of DATA.categories) for(const g of c.guides) all.push({key:'guide:'+g.slug,title:g.title});
  for(const col of DATA.collections) for(const p of col.parts) all.push({key:'col:'+col.id+':'+p.slug,title:p.title});
  return all;
}

function showContent(key){
  let content=null,title='',crumbText='';
  if(key.startsWith('guide:')){
    const slug=key.slice(6);
    let cat=null,guide=null;
    for(const c of DATA.categories){const g=c.guides.find(x=>x.slug===slug);if(g){cat=c;guide=g;break;}}
    if(!guide) return showHome();
    content=DATA.guideContents[slug]; title=guide.title;
    crumbText=' / '+cat.label+' / '+guide.title;
  } else if(key.startsWith('col:')){
    const [,colId,partSlug]=key.split(':');
    const col=DATA.collections.find(c=>c.id===colId); if(!col) return showHome();
    const part=col.parts.find(p=>p.slug===partSlug); if(!part) return showHome();
    content=DATA.collectionContents[colId]&&DATA.collectionContents[colId][partSlug];
    title=part.title; crumbText=' / '+col.label+' / '+part.title;
  }
  if(!content){currentShadow=null;main.innerHTML='<div class="sa-message"><p>콘텐츠를 찾을 수 없습니다.</p></div>';return}
  crumb.textContent=crumbText; printBtn.style.display='inline-block';
  const all=flatNav(); const i=all.findIndex(x=>x.key===key);
  const prev=i>0?all[i-1]:null; const next=i<all.length-1?all[i+1]:null;
  let html='<div class="sa-guide-wrap"><div class="sa-guide-host" id="guideHost"></div></div>';
  html += '<div class="sa-footer-nav">';
  html += prev?'<button data-key="'+prev.key+'">← '+escapeHtml(prev.title)+'</button>':'<span></span>';
  html += next?'<button data-key="'+next.key+'">'+escapeHtml(next.title)+' →</button>':'<span></span>';
  html += '</div>';
  main.innerHTML=html;
  renderShadowContent(document.getElementById('guideHost'), content);
  main.querySelectorAll('.sa-footer-nav button[data-key]').forEach(b=>b.addEventListener('click',()=>route(b.dataset.key)));
  renderSidebar(key); main.scrollTop=0; location.hash='#'+encodeURIComponent(key);
}

function route(key){if(!key) showHome(); else showContent(key)}

homeBtn.addEventListener('click',()=>{location.hash=''; showHome()});
printBtn.addEventListener('click',()=>window.print());
window.addEventListener('hashchange',()=>{const s=decodeURIComponent(location.hash.replace('#',''));if(s)showContent(s);else showHome()});

const initial=decodeURIComponent(location.hash.replace('#',''));
if(initial) showContent(initial); else showHome();
</script>
</body>
</html>
`;

const out = SHELL.replace("__APP_DATA__", JSON.stringify(APP_DATA).replace(/</g, "\\u003c"));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, "utf8");
console.log(`✅ ${path.relative(ROOT, OUT)}  (${(out.length/1024).toFixed(1)} KB)`);
