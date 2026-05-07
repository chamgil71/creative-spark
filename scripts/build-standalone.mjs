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
  const fp = path.join(PUBLIC, "guides", file);
  if (!fs.existsSync(fp)) {
    console.warn(`  ⚠️  missing: ${fp}`);
    return null;
  }
  const raw = fs.readFileSync(fp, "utf8");
  const $ = load(raw);
  // remove inter-page navigation that doesn't make sense in standalone
  $("script").remove();
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
<html lang="ko" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>AI 가이드 허브 (오프라인)</title>
<style>
  html[data-theme="dark"]{--bg:#0b0d12;--panel:#11141b;--panel-2:#161a23;--border:#222836;--fg:#e6e8ee;--muted:#8a93a6;--accent:#6366f1;--main-bg:#fff;--main-fg:#111;--footer-bg:#fafafa;--footer-border:#eee;--footer-btn-bg:#fff;--footer-btn-border:#ddd;--footer-btn-hover:#f0f0f0;}
  html[data-theme="light"]{--bg:#f7f8fb;--panel:#ffffff;--panel-2:#f0f2f7;--border:#e3e6ee;--fg:#1a1d24;--muted:#5b6473;--accent:#6366f1;--main-bg:#fff;--main-fg:#111;--footer-bg:#fafafa;--footer-border:#eee;--footer-btn-bg:#fff;--footer-btn-border:#ddd;--footer-btn-hover:#f0f0f0;}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Pretendard","Noto Sans KR",sans-serif;}
  a{color:inherit}
  header{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);}
  .bar{display:flex;align-items:center;gap:12px;padding:12px 20px;}
  .bar h1{font-size:16px;margin:0;font-weight:700}
  .bar .crumb{color:var(--muted);font-size:14px}
  .bar button{background:var(--panel-2);color:var(--fg);border:1px solid var(--border);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:13px}
  .bar button:hover{background:color-mix(in srgb,var(--panel-2) 70%,var(--accent) 10%)}
  .toolbar{display:flex;gap:8px;margin-left:auto}
  .layout{display:grid;grid-template-columns:280px 1fr;min-height:calc(100vh - 53px);}
  aside{border-right:1px solid var(--border);background:var(--panel);overflow-y:auto;max-height:calc(100vh - 53px);}
  .cat{padding:12px 16px 4px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:8px}
  .dot{width:8px;height:8px;border-radius:50%}
  .nav a,.nav button{display:block;width:100%;text-align:left;padding:6px 16px 6px 32px;font-size:14px;color:var(--muted);text-decoration:none;cursor:pointer;background:none;border:none;font-family:inherit}
  .nav a:hover,.nav button:hover{background:var(--panel-2);color:var(--fg)}
  .nav a.active,.nav button.active{background:var(--panel-2);color:var(--fg);font-weight:600;border-left:3px solid var(--accent);padding-left:29px}
  main{overflow-y:auto;max-height:calc(100vh - 53px);background:var(--main-bg);color:var(--main-fg)}
  .home{padding:40px 32px;background:var(--bg);color:var(--fg);min-height:100%}
  .home h2{font-size:28px;margin:0 0 8px}
  .home p.lead{color:var(--muted);margin:0 0 32px}
  .cat-block{margin-bottom:32px}
  .cat-block h3{font-size:18px;margin:0 0 12px;display:flex;align-items:center;gap:8px}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
  .card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:16px;cursor:pointer;transition:transform .15s,border-color .15s}
  .card:hover{transform:translateY(-2px);border-color:var(--accent)}
  .card .t{font-weight:600;margin-bottom:4px}
  .card .s{color:var(--muted);font-size:13px}
  .guide-wrap{padding:24px 32px;max-width:1100px;margin:0 auto}
  .footer-nav{display:flex;justify-content:space-between;padding:16px 32px;border-top:1px solid var(--footer-border);background:var(--footer-bg)}
  .footer-nav button{background:var(--footer-btn-bg);border:1px solid var(--footer-btn-border);padding:8px 14px;border-radius:8px;cursor:pointer}
  .footer-nav button:hover{background:var(--footer-btn-hover)}
  @media (max-width:800px){.layout{grid-template-columns:1fr}aside{display:none}}
</style>
</head>
<body>
<header>
  <div class="bar">
    <button id="homeBtn">🏠 홈</button>
    <h1>AI 가이드 허브</h1>
    <span class="crumb" id="crumb"></span>
    <div class="toolbar">
      <button id="themeBtn" title="테마 전환">🌙 다크</button>
      <button id="printBtn" style="display:none">🖨 인쇄 / PDF</button>
    </div>
  </div>
</header>
<div class="layout">
  <aside id="sidebar"></aside>
  <main id="main"></main>
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

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]))}

themeBtn.addEventListener('click',()=>{
  const next = document.documentElement.dataset.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme = next;
  themeBtn.textContent = next==='dark'?'🌙 다크':'☀️ 라이트';
});

function renderSidebar(activeKey){
  let html = '<div class="nav">';
  for(const c of DATA.categories){
    html += '<div class="cat"><span class="dot" style="background:'+c.color+'"></span>'+escapeHtml(c.label)+'</div>';
    for(const g of c.guides){
      const cls = activeKey==='guide:'+g.slug?'active':'';
      html += '<a class="'+cls+'" data-key="guide:'+g.slug+'">'+escapeHtml(g.title)+'</a>';
    }
  }
  for(const col of DATA.collections){
    html += '<div class="cat"><span class="dot" style="background:'+col.color+'"></span>'+escapeHtml(col.label)+'</div>';
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
  crumb.textContent=''; printBtn.style.display='none';
  let html = '<div class="home"><h2>AI 가이드 허브</h2><p class="lead">필요한 도구를 골라 빠르게 익히세요. 인터넷 없이 작동합니다.</p>';
  for(const c of DATA.categories){
    html += '<div class="cat-block"><h3><span class="dot" style="background:'+c.color+'"></span>'+escapeHtml(c.label)+'</h3><div class="cards">';
    for(const g of c.guides){
      html += '<div class="card" data-key="guide:'+g.slug+'"><div class="t">'+escapeHtml(g.title)+'</div><div class="s">'+escapeHtml(g.subtitle)+'</div></div>';
    }
    html += '</div></div>';
  }
  if(DATA.collections.length){
    html += '<h2 style="margin-top:40px">시리즈 가이드</h2>';
    for(const col of DATA.collections){
      html += '<div class="cat-block"><h3><span class="dot" style="background:'+col.color+'"></span>'+escapeHtml(col.label)+'</h3><div class="cards">';
      for(const p of col.parts){
        html += '<div class="card" data-key="col:'+col.id+':'+p.slug+'"><div class="t">'+escapeHtml(p.title)+'</div></div>';
      }
      html += '</div></div>';
    }
  }
  html += '</div>';
  main.innerHTML = html;
  main.querySelectorAll('.card').forEach(el=>el.addEventListener('click',()=>route(el.dataset.key)));
  renderSidebar(null);
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
  if(!content){main.innerHTML='<div class="guide-wrap"><p>콘텐츠를 찾을 수 없습니다.</p></div>';return}
  crumb.textContent=crumbText; printBtn.style.display='inline-block';
  const all=flatNav(); const i=all.findIndex(x=>x.key===key);
  const prev=i>0?all[i-1]:null; const next=i<all.length-1?all[i+1]:null;
  let html='';
  if(content.styles) html+='<style>'+content.styles+'</style>';
  html += '<div class="guide-wrap">'+content.body+'</div>';
  html += '<div class="footer-nav">';
  html += prev?'<button data-key="'+prev.key+'">← '+escapeHtml(prev.title)+'</button>':'<span></span>';
  html += next?'<button data-key="'+next.key+'">'+escapeHtml(next.title)+' →</button>':'<span></span>';
  html += '</div>';
  main.innerHTML=html;
  main.querySelectorAll('.footer-nav button[data-key]').forEach(b=>b.addEventListener('click',()=>route(b.dataset.key)));
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