#!/usr/bin/env python3
"""
md_to_html.py — MD + template.json → HTML 변환기
Usage: python3 md_to_html.py --content content.md --template template.json --output output.html
"""

import json
import re
import argparse
import sys
from pathlib import Path


# ─────────────────────────────────────────────
# 1. 설정 로더
# ─────────────────────────────────────────────

def load_config(template_path: str) -> dict:
    with open(template_path, encoding="utf-8") as f:
        raw = json.load(f)
    return resolve_auto(raw)


def resolve_auto(cfg: dict) -> dict:
    """'auto' 값을 primary 색상 기반으로 자동 계산"""
    colors = cfg["theme"]["colors"]
    primary = colors["primary"]

    def hex_to_rgb(h):
        h = h.lstrip("#")
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

    def rgb_to_hex(r, g, b):
        return f"#{r:02X}{g:02X}{b:02X}"

    def mix_with_white(hex_color, opacity):
        r, g, b = hex_to_rgb(hex_color)
        r2 = int(r + (255 - r) * (1 - opacity))
        g2 = int(g + (255 - g) * (1 - opacity))
        b2 = int(b + (255 - b) * (1 - opacity))
        return rgb_to_hex(r2, g2, b2)

    if colors.get("accent_bg") == "auto":
        colors["accent_bg"] = mix_with_white(primary, 0.10)
    if colors.get("table_alt") == "auto":
        colors["table_alt"] = mix_with_white(primary, 0.05)
    if colors.get("border") == "auto":
        colors["border"] = mix_with_white(primary, 0.20)

    return cfg


# ─────────────────────────────────────────────
# 2. MD 파서
# ─────────────────────────────────────────────

def parse_md(content: str) -> list:
    """MD 텍스트를 토큰 리스트로 변환"""
    tokens = []
    lines = content.split("\n")
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # ── 펜스 블록 처리 (```type ... ```) ──
        fence_match = re.match(r"^```(\w+(?::\w+)?)(.*)?$", stripped)
        if fence_match:
            block_type = fence_match.group(1)
            block_meta = fence_match.group(2).strip() if fence_match.group(2) else ""
            block_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                block_lines.append(lines[i])
                i += 1
            tokens.append({
                "type": block_type,
                "meta": block_meta,
                "content": "\n".join(block_lines)
            })
            i += 1
            continue

        # ── nav 블록 (---nav ... ---) ──
        if stripped == "---nav":
            nav_lines = []
            i += 1
            while i < len(lines) and lines[i].strip() != "---":
                nav_lines.append(lines[i])
                i += 1
            tokens.append({"type": "nav", "content": "\n".join(nav_lines)})
            i += 1
            continue

        # ── 섹션 구분자 (---) ──
        if stripped == "---":
            tokens.append({"type": "hr"})
            i += 1
            continue

        # ── 문서 제목 (#) ──
        if stripped.startswith("# ") and not stripped.startswith("## "):
            tokens.append({"type": "doc_title", "content": stripped[2:]})
            i += 1
            continue

        # ── 섹션 헤더 (## N 제목) ──
        sec_match = re.match(r"^## (\d+)\s+(.+)$", stripped)
        if sec_match:
            tokens.append({
                "type": "section_header",
                "number": sec_match.group(1),
                "content": sec_match.group(2)
            })
            i += 1
            continue

        # ── 서브섹션 헤더 (### 제목) ──
        if stripped.startswith("### "):
            tokens.append({"type": "h3_heading", "content": stripped[4:]})
            i += 1
            continue

        # ── 표 캡션 + 표 ──
        table_cap_match = re.match(r"^\*\*\[표\s*\d+\](.+)\*\*$", stripped)
        if table_cap_match:
            caption = stripped.strip("*").strip()
            table_rows = []
            i += 1
            while i < len(lines) and "|" in lines[i]:
                row = lines[i].strip()
                if not re.match(r"^\|[-:\s|]+\|$", row):
                    cells = [c.strip() for c in row.strip("|").split("|")]
                    table_rows.append(cells)
                i += 1
            tokens.append({"type": "table", "caption": caption, "rows": table_rows})
            continue

        # ── 인라인 표 (캡션 없는) ──
        if stripped.startswith("|") and stripped.endswith("|"):
            rows = []
            while i < len(lines) and "|" in lines[i]:
                row = lines[i].strip()
                if not re.match(r"^\|[-:\s|]+\|$", row):
                    cells = [c.strip() for c in row.strip("|").split("|")]
                    rows.append(cells)
                i += 1
            if rows:
                tokens.append({"type": "table", "caption": None, "rows": rows})
            continue

        # ── 날짜/부서 행 (숫자+한글 패턴) ──
        if re.match(r"^\d{4}\.\d+\.\d+", stripped):
            tokens.append({"type": "meta_line", "content": stripped})
            i += 1
            continue

        # ── 계층 마커 ──
        if stripped.startswith("■ "):
            tokens.append({"type": "h1", "content": stripped[2:]})
        elif stripped.startswith("○ "):
            tokens.append({"type": "h2", "content": stripped[2:]})
        elif stripped.startswith("– ") or stripped.startswith("- "):
            tokens.append({"type": "h3", "content": re.sub(r"^[–\-]\s", "", stripped)})
        elif stripped.startswith("* "):
            tokens.append({"type": "note", "content": stripped[2:]})
        elif stripped.startswith("è "):
            tokens.append({"type": "conclusion", "content": stripped[2:]})
        elif stripped == "":
            tokens.append({"type": "blank"})
        else:
            tokens.append({"type": "paragraph", "content": stripped})

        i += 1

    return tokens


# ─────────────────────────────────────────────
# 3. 인라인 포매터
# ─────────────────────────────────────────────

def fmt_inline(text: str, cfg: dict) -> str:
    """볼드, 인라인 코드, kbd, badge 처리"""
    primary_dark = cfg["theme"]["colors"]["primary_dark"]
    primary_mid  = cfg["theme"]["colors"]["primary_mid"]

    # `kbd:Ctrl+K` → <kbd> 태그
    text = re.sub(
        r"`kbd:([^`]+)`",
        lambda m: "".join(
            f'<kbd class="kbd">{k.strip()}</kbd>'
            for k in m.group(1).split("+")
        ),
        text
    )

    # `badge:color:text` 또는 `badge:text`
    def make_badge(m):
        parts = m.group(1).split(":", 1)
        if len(parts) == 2:
            color, label = parts
        else:
            color, label = "default", parts[0]
        return f'<span class="badge badge-{color}">{label}</span>'
    text = re.sub(r"`badge:([^`]+)`", make_badge, text)

    # **bold** → <strong>
    text = re.sub(r"\*\*(.+?)\*\*", r'<strong>\1</strong>', text)

    # `code` → <code>
    text = re.sub(r"`([^`]+)`", r'<code class="inline-code">\1</code>', text)

    return text


# ─────────────────────────────────────────────
# 4. 컴포넌트 렌더러
# ─────────────────────────────────────────────

def render_info_box(token: dict, cfg: dict) -> str:
    comps = cfg["components"]["info_box"]
    meta  = token.get("meta", "")
    content = fmt_inline(token["content"], cfg)

    # info:warn / info:ok / info:danger
    variant_key = meta.lstrip(":").strip() if meta else "default"
    if variant_key in comps.get("variants", {}):
        v = comps["variants"][variant_key]
        bg     = v["background"]
        border = v["border_left"]
        icon   = v.get("icon", "")
    else:
        bg     = cfg["theme"]["colors"]["accent_bg"]
        border = cfg["theme"]["colors"]["primary_mid"]
        icon   = comps.get("icon", "")

    content_html = content.replace("\n", "<br>")
    return f'''<div class="info-box" style="background:{bg};border-left-color:{border};">
  {f'<span class="info-icon">{icon}</span>' if icon else ''}
  <div class="info-content">{content_html}</div>
</div>'''


def render_tip_card(token: dict, cfg: dict) -> str:
    comps = cfg["components"]["tip_card"]
    color_map = comps["color_options"]

    block_type = token["type"]   # e.g. "tip:green"
    color_key  = block_type.split(":", 1)[1] if ":" in block_type else "green"
    border_color = comps["color_map"].get(color_key, "#3FB950")

    lines = token["content"].strip().split("\n")
    title = ""
    body_lines = []
    for ln in lines:
        if ln.startswith("**") and ln.endswith("**"):
            title = ln.strip("*")
        else:
            body_lines.append(fmt_inline(ln, cfg))

    title_html = f'<strong class="tip-title">{fmt_inline(title, cfg)}</strong>' if title else ""
    body_html  = "<br>".join(body_lines)

    return f'''<div class="tip-card" style="border-left-color:{border_color};">
  {title_html}
  <p class="tip-body">{body_html}</p>
</div>'''


def render_terminal(token: dict, cfg: dict) -> str:
    comps = cfg["components"]["terminal"]
    syn   = comps["syntax"]
    meta  = token.get("meta", "")
    title_match = re.search(r'title="([^"]+)"', meta)
    title = title_match.group(1) if title_match else "terminal"

    def highlight(code: str) -> str:
        lines_out = []
        for ln in code.split("\n"):
            ln_esc = ln.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            # comment
            if re.match(r"^\s*#", ln_esc):
                ln_esc = f'<span style="color:{syn["comment"]}">{ln_esc}</span>'
            # $ command
            elif re.match(r"^\s*\$", ln_esc):
                ln_esc = re.sub(
                    r"(\$\s*)(\S+)",
                    lambda m: f'<span style="color:{syn["command"]}">{m.group(1)}{m.group(2)}</span>',
                    ln_esc, count=1
                )
            # yaml key: val
            elif re.match(r"^\w+:", ln_esc):
                ln_esc = re.sub(
                    r"^(\w+:)",
                    f'<span style="color:{syn["keyword"]}">\\1</span>',
                    ln_esc
                )
            lines_out.append(ln_esc)
        return "\n".join(lines_out)

    highlighted = highlight(token["content"])

    return f'''<div class="terminal">
  <div class="terminal-header">
    <span class="tl" style="background:#FF5F56"></span>
    <span class="tl" style="background:#FFBD2E"></span>
    <span class="tl" style="background:#27C93F"></span>
    <span class="terminal-title">{title}</span>
  </div>
  <pre class="terminal-body">{highlighted}</pre>
</div>'''


def render_feature_cards(token: dict, cfg: dict) -> str:
    comps = cfg["components"]["feature_card"]
    tag_colors = comps["tag_colors"]
    cards = []

    for ln in token["content"].strip().split("\n"):
        if not ln.strip():
            continue
        parts = [p.strip() for p in ln.split("|")]
        if len(parts) < 3:
            continue
        icon  = parts[0] if len(parts) > 0 else ""
        title = parts[1] if len(parts) > 1 else ""
        desc  = parts[2] if len(parts) > 2 else ""
        tag_raw = parts[3] if len(parts) > 3 else ""

        tag_html = ""
        if tag_raw.startswith("tag:"):
            tag_val = tag_raw[4:]
            tag_parts = tag_val.split(":", 1)
            if len(tag_parts) == 2:
                color_key, label = tag_parts
            else:
                color_key, label = "default", tag_parts[0]

            # danger 태그는 tip_card의 color_map에서
            tip_colors = cfg["components"]["tip_card"]["color_map"]
            if color_key in tip_colors:
                c = tip_colors[color_key]
                tag_html = f'<span class="feature-tag" style="background:{c}22;color:{c}">{label}</span>'
            else:
                tc = tag_colors.get(color_key, tag_colors["default"])
                tag_html = f'<span class="feature-tag" style="background:{tc["bg"]};color:{tc["text"]}">{label}</span>'

        cards.append(f'''<div class="feature-card">
  <div class="feature-icon">{icon}</div>
  <h3 class="feature-title">{fmt_inline(title, cfg)}</h3>
  <p class="feature-desc">{fmt_inline(desc, cfg)}</p>
  {tag_html}
</div>''')

    return f'<div class="feature-grid">{"".join(cards)}</div>'


def render_flow_steps(token: dict, cfg: dict) -> str:
    comps = cfg["components"]["flow_steps"]
    arrow_color = comps["arrow_color"]
    steps_raw = [s.strip() for s in token["content"].strip().split("→")]
    steps_html = []
    for step in steps_raw:
        if not step:
            continue
        # "💾 Push" 형태
        parts = step.split(" ", 1)
        icon  = parts[0] if len(parts) > 1 else ""
        label = parts[1] if len(parts) > 1 else parts[0]
        steps_html.append(f'''<div class="flow-step">
  <div class="flow-icon">{icon}</div>
  <div class="flow-label">{label}</div>
</div>''')

    inner = f'<div class="flow-arrow" style="color:{arrow_color}">→</div>'.join(steps_html)
    return f'<div class="flow-steps">{inner}</div>'


def render_gitflow(token: dict, cfg: dict) -> str:
    comps = cfg["components"]["git_flow"]
    branch_colors = comps["branch_colors"]
    rows_html = []

    for ln in token["content"].strip().split("\n"):
        if not ln.strip() or ":" not in ln:
            continue
        branch_name, commits_raw = ln.split(":", 1)
        branch_name = branch_name.strip()
        commits = [c.strip() for c in commits_raw.split(",")]
        color = branch_colors.get(branch_name, "#888")

        commits_html = []
        for c in commits:
            if c:
                commits_html.append(
                    f'<div class="commit" style="border-color:{color};">'
                    f'<span class="commit-label">{c}</span></div>'
                )
                commits_html.append(f'<div class="commit-line" style="background:{color};"></div>')
            else:
                commits_html.append(f'<div style="flex:0.5;height:3px"></div>')

        rows_html.append(f'''<div class="branch-row">
  <div class="branch-label" style="color:{color}">{branch_name}</div>
  <div class="branch-line">{"".join(commits_html)}</div>
</div>''')

    return f'''<div class="git-flow-container">
  <div class="flow-branches">{"".join(rows_html)}</div>
</div>'''


def render_table(token: dict, cfg: dict) -> str:
    colors = cfg["theme"]["colors"]
    rows   = token["rows"]
    caption = token.get("caption")

    if not rows:
        return ""

    header_row = rows[0]
    body_rows  = rows[1:]

    header_html = "".join(f"<th>{fmt_inline(h, cfg)}</th>" for h in header_row)
    body_html = ""
    for idx, row in enumerate(body_rows):
        alt = ' class="alt-row"' if idx % 2 == 1 else ""
        cells = "".join(f"<td>{fmt_inline(c, cfg)}</td>" for c in row)
        body_html += f"<tr{alt}>{cells}</tr>"

    cap_html = f'<caption class="table-caption">{caption}</caption>' if caption else ""

    return f'''<div class="table-wrapper">
  <table class="doc-table">
    {cap_html}
    <thead><tr>{header_html}</tr></thead>
    <tbody>{body_html}</tbody>
  </table>
</div>'''


# ─────────────────────────────────────────────
# 5. 토큰 → HTML 변환
# ─────────────────────────────────────────────

FENCE_RENDERERS = {
    "info":       render_info_box,
    "terminal":   render_terminal,
    "cards":      render_feature_cards,
    "flow":       render_flow_steps,
    "gitflow":    render_gitflow,
}

TIP_PREFIX = "tip"


def tokens_to_html(tokens: list, cfg: dict) -> str:
    html_parts = []
    colors  = cfg["theme"]["colors"]
    markers = cfg["structure"]["markers"]

    for tok in tokens:
        t = tok["type"]

        # ── nav ──
        if t == "nav":
            nav_cfg = cfg["components"]["nav"]
            links = []
            for ln in tok["content"].split("\n"):
                m = re.match(r"links:\s*(.+)", ln.strip())
                if m:
                    for lnk in m.group(1).split(","):
                        lnk = lnk.strip()
                        anchor = lnk.replace(" ", "-").lower()
                        links.append(f'<li><a href="#{anchor}">{lnk}</a></li>')
            links_html = "".join(links)
            html_parts.append(f'''<nav class="doc-nav">
  <div class="nav-inner">
    <span class="nav-brand">{cfg["meta"]["name"]}</span>
    <ul class="nav-links">{links_html}</ul>
  </div>
</nav>''')
            continue

        # ── doc_title ──
        if t == "doc_title":
            html_parts.append(
                f'<div class="doc-title-wrap"><h1 class="doc-title">{fmt_inline(tok["content"], cfg)}</h1></div>'
            )
            continue

        # ── meta_line (날짜/부서) ──
        if t == "meta_line":
            html_parts.append(f'<p class="meta-line">{tok["content"]}</p>')
            continue

        # ── section_header ──
        if t == "section_header":
            html_parts.append(f'''<div class="section-header">
  <span class="section-num-badge">{tok["number"]}</span>
  <span class="section-title-text">{fmt_inline(tok["content"], cfg)}</span>
</div>''')
            continue

        # ── h3_heading (### 소제목) ──
        if t == "h3_heading":
            html_parts.append(f'<h3 class="sub-heading">{fmt_inline(tok["content"], cfg)}</h3>')
            continue

        # ── 계층 마커 ──
        if t == "h1":
            html_parts.append(f'<p class="marker-h1"><span class="m1">■</span> {fmt_inline(tok["content"], cfg)}</p>')
            continue
        if t == "h2":
            html_parts.append(f'<p class="marker-h2"><span class="m2">○</span> {fmt_inline(tok["content"], cfg)}</p>')
            continue
        if t == "h3":
            html_parts.append(f'<p class="marker-h3"><span class="m3">–</span> {fmt_inline(tok["content"], cfg)}</p>')
            continue
        if t == "note":
            html_parts.append(f'<p class="marker-note">* {fmt_inline(tok["content"], cfg)}</p>')
            continue
        if t == "conclusion":
            html_parts.append(f'<div class="conclusion-box">è {fmt_inline(tok["content"], cfg)}</div>')
            continue

        # ── 표 ──
        if t == "table":
            html_parts.append(render_table(tok, cfg))
            continue

        # ── 펜스 블록 ──
        if t in FENCE_RENDERERS:
            html_parts.append(FENCE_RENDERERS[t](tok, cfg))
            continue
        if t.startswith(TIP_PREFIX):
            html_parts.append(render_tip_card(tok, cfg))
            continue

        # ── 일반 단락 ──
        if t == "paragraph" and tok.get("content"):
            html_parts.append(f'<p class="body-text">{fmt_inline(tok["content"], cfg)}</p>')
            continue

        if t == "hr":
            html_parts.append('<hr class="section-divider">')
            continue

    return "\n".join(html_parts)


# ─────────────────────────────────────────────
# 6. CSS 생성
# ─────────────────────────────────────────────

def generate_css(cfg: dict) -> str:
    c  = cfg["theme"]["colors"]
    f  = cfg["theme"]["fonts"]
    sz = cfg["theme"]["sizes"]
    sp = cfg["theme"]["spacing"]
    comp = cfg["components"]

    # pt → px 변환
    def pt(v): return f"{v * 1.333:.1f}px"

    body_font    = f.get("body", "맑은 고딕")
    heading_font = f.get("heading", "맑은 고딕")
    fallback     = f.get("fallback", "sans-serif")

    return f"""
/* ── CSS 변수 (theme token) ── */
:root {{
  --c-primary:        {c['primary']};
  --c-primary-dark:   {c['primary_dark']};
  --c-primary-mid:    {c['primary_mid']};
  --c-accent-bg:      {c['accent_bg']};
  --c-table-alt:      {c['table_alt']};
  --c-border:         {c['border']};
  --c-text:           {c['text_body']};
  --c-text-muted:     {c['text_muted']};
  --c-text-on-primary:{c['text_on_primary']};
  --c-background:     {c['background']};
  --c-page-bg:        {c['page_bg']};
  --f-body:           '{body_font}', {fallback};
  --f-heading:        '{heading_font}', {fallback};
  --f-code:           '{f.get("code","monospace")}', monospace;
  --lh:               {sp['line_height']};
  --indent-h2:        {sp['indent_h2_mm']}mm;
  --indent-h3:        {sp['indent_h3_mm']}mm;
  --radius:           8px;
  --radius-lg:        12px;
  --shadow:           0 2px 12px rgba(0,0,0,0.07);
  --shadow-md:        0 4px 24px rgba(0,0,0,0.10);
}}

/* ── 기본 리셋 ── */
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
html {{ scroll-behavior: smooth; font-size: 16px; }}
body {{
  font-family: var(--f-body);
  background: var(--c-page-bg);
  color: var(--c-text);
  line-height: var(--lh);
  font-size: {pt(sz['body'])};
}}

/* ── 네비게이션 ── */
.doc-nav {{
  position: sticky; top: 0; z-index: 100;
  background: rgba(13,17,23,0.97);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding: 0 24px;
}}
.nav-inner {{
  max-width: {cfg['output']['html']['max_content_width']};
  margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  height: 56px;
}}
.nav-brand {{ color: #fff; font-weight: 700; font-size: 15px; }}
.nav-links {{ display: flex; gap: 4px; list-style: none; }}
.nav-links a {{
  text-decoration: none; color: #8B949E; font-size: 13px;
  padding: 5px 10px; border-radius: 6px; transition: all .2s;
}}
.nav-links a:hover {{ background: rgba(255,255,255,0.1); color: #fff; }}

/* ── 문서 래퍼 ── */
.doc-wrapper {{
  max-width: {cfg['output']['html']['max_content_width']};
  margin: 0 auto;
  background: var(--c-background);
  padding: 40px 48px 64px;
}}
@media (max-width: 720px) {{ .doc-wrapper {{ padding: 24px 20px 48px; }} }}

/* ── 문서 제목 ── */
.doc-title-wrap {{ margin-bottom: 8px; }}
.doc-title {{
  font-family: var(--f-heading);
  font-size: {pt(sz['doc_title'])};
  font-weight: 700;
  color: var(--c-primary-dark);
  line-height: 1.3;
}}
.meta-line {{
  font-size: {pt(sz['footnote'])};
  color: var(--c-text-muted);
  margin-bottom: 32px;
}}

/* ── 섹션 헤더 ── */
.section-header {{
  display: flex; align-items: center; gap: 10px;
  background: var(--c-primary);
  color: var(--c-text-on-primary);
  padding: 7px 16px;
  margin: 32px 0 20px;
  font-family: var(--f-heading);
  font-size: {pt(sz['section'])};
  font-weight: 700;
  border-radius: 0;
}}
.section-num-badge {{
  background: var(--c-text-on-primary);
  color: var(--c-primary);
  font-size: 12px; font-weight: 700;
  padding: 1px 7px; border-radius: 3px;
  flex-shrink: 0;
}}

/* ── 계층 마커 ── */
.marker-h1 {{
  font-size: {pt(sz['h1'])};
  font-weight: 700;
  color: var(--c-text);
  margin: 16px 0 8px;
  line-height: var(--lh);
}}
.m1 {{ color: var(--c-primary-dark); margin-right: 4px; }}

.marker-h2 {{
  font-size: {pt(sz['h2'])};
  font-weight: 400;
  color: var(--c-text);
  margin: 8px 0 4px var(--indent-h2);
  line-height: var(--lh);
}}
.m2 {{ color: var(--c-primary-mid); margin-right: 4px; }}

.marker-h3 {{
  font-size: {pt(sz['h3'])};
  color: var(--c-text-muted);
  margin: 4px 0 2px var(--indent-h3);
  line-height: var(--lh);
}}
.m3 {{ color: var(--c-text-muted); margin-right: 4px; }}

.marker-note {{
  font-size: {pt(sz['footnote'])};
  color: var(--c-text-muted);
  margin: 2px 0 2px var(--indent-h3);
}}

.sub-heading {{
  font-size: {pt(sz['h2'])};
  font-weight: 700;
  color: var(--c-text);
  margin: 20px 0 12px;
}}

.body-text {{
  font-size: {pt(sz['body'])};
  color: var(--c-text);
  margin: 6px 0;
  line-height: var(--lh);
}}

/* ── 결론 박스 ── */
.conclusion-box {{
  background: var(--c-accent-bg);
  border-left: 3px solid var(--c-primary-mid);
  border-radius: 0 6px 6px 0;
  padding: 10px 16px;
  margin: 16px 0 16px var(--indent-h2);
  font-size: {pt(sz['body'])};
  line-height: var(--lh);
}}

/* ── info box ── */
.info-box {{
  display: flex; gap: 10px;
  border-left: 3px solid var(--c-primary-mid);
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  margin: 14px 0;
  font-size: {pt(sz['body'])};
  line-height: var(--lh);
}}
.info-icon {{ font-size: 16px; flex-shrink: 0; margin-top: 1px; }}
.info-content {{ flex: 1; }}

/* ── tip card ── */
.tip-card {{
  background: var(--c-background);
  border-left: 4px solid;
  border-radius: 0 8px 8px 0;
  padding: 18px 22px;
  margin: 10px 0;
  box-shadow: var(--shadow);
}}
.tip-title {{
  display: block;
  margin-bottom: 5px;
  font-size: {pt(sz['h2'])};
  color: var(--c-text);
}}
.tip-body {{
  font-size: {pt(sz['body'])};
  color: var(--c-text-muted);
  line-height: var(--lh);
}}

/* ── terminal ── */
.terminal {{
  background: #0D1117;
  border-radius: var(--radius);
  border: 1px solid #30363D;
  overflow: hidden;
  margin: 16px 0;
}}
.terminal-header {{
  background: #161B22;
  padding: 9px 16px;
  display: flex; align-items: center; gap: 7px;
  border-bottom: 1px solid #30363D;
}}
.tl {{ width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }}
.terminal-title {{
  font-size: 12px; color: #8B949E;
  margin-left: 6px; font-family: var(--f-code);
}}
.terminal-body {{
  padding: 16px 20px;
  font-family: var(--f-code);
  font-size: 13px;
  color: #E6EDF3;
  line-height: 1.75;
  overflow-x: auto;
  white-space: pre;
}}

/* ── feature grid ── */
.feature-grid {{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
  margin: 16px 0;
}}
.feature-card {{
  background: var(--c-background);
  border-radius: var(--radius-lg);
  padding: 22px;
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow);
  transition: transform .2s;
}}
.feature-card:hover {{ transform: translateY(-3px); }}
.feature-icon {{ font-size: 28px; margin-bottom: 12px; }}
.feature-title {{ font-size: {pt(sz['h2'])}; font-weight: 700; margin-bottom: 6px; }}
.feature-desc {{ font-size: {pt(sz['body'])}; color: var(--c-text-muted); line-height: var(--lh); }}
.feature-tag {{
  display: inline-block; margin-top: 10px;
  font-size: 11px; font-weight: 600;
  padding: 2px 10px; border-radius: 100px;
}}

/* ── flow steps ── */
.flow-steps {{
  display: flex; align-items: center;
  flex-wrap: wrap; gap: 0;
  justify-content: center;
  margin: 20px 0; padding: 24px;
  background: var(--c-background);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}}
.flow-step {{
  background: var(--c-background);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 14px 18px;
  text-align: center;
  min-width: 110px;
  box-shadow: var(--shadow);
}}
.flow-icon {{ font-size: 22px; margin-bottom: 4px; }}
.flow-label {{ font-size: 12px; font-weight: 700; color: var(--c-text); }}
.flow-arrow {{
  font-size: 18px; padding: 0 10px;
  color: var(--c-border);
}}

/* ── git flow ── */
.git-flow-container {{
  background: #0D1117;
  border-radius: var(--radius-lg);
  padding: 28px;
  border: 1px solid #30363D;
  overflow-x: auto;
  margin: 16px 0;
}}
.flow-branches {{ display: flex; flex-direction: column; gap: 18px; min-width: 500px; }}
.branch-row {{ display: flex; align-items: center; gap: 0; }}
.branch-label {{ width: 80px; font-size: 12px; font-weight: 700; flex-shrink: 0; }}
.branch-line {{ flex: 1; display: flex; align-items: center; }}
.commit {{
  width: 18px; height: 18px;
  border-radius: 50%; border: 3px solid;
  flex-shrink: 0; position: relative;
}}
.commit-label {{
  font-size: 10px; color: #8B949E;
  position: absolute; top: 20px; left: -16px;
  white-space: nowrap;
}}
.commit-line {{ flex: 1; height: 3px; }}

/* ── 표 ── */
.table-wrapper {{
  overflow-x: auto; margin: 14px 0;
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow);
}}
.doc-table {{
  width: 100%; border-collapse: collapse;
  font-size: {pt(sz['table_body'])};
}}
.doc-table caption.table-caption {{
  caption-side: top;
  text-align: center;
  font-weight: 700;
  font-size: {pt(sz['caption'])};
  padding: 8px;
  color: var(--c-text);
  background: var(--c-page-bg);
  border-bottom: 1px solid var(--c-border);
}}
.doc-table thead tr {{
  background: var(--c-primary-mid);
  color: var(--c-text-on-primary);
}}
.doc-table th {{
  padding: 8px 12px;
  font-weight: 600;
  font-size: {pt(sz['table_header'])};
  text-align: left;
}}
.doc-table td {{
  padding: 7px 12px;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text);
}}
.doc-table tr.alt-row td {{ background: var(--c-table-alt); }}
.doc-table tr:last-child td {{ border-bottom: none; }}

/* ── 인라인 요소 ── */
strong {{ font-weight: 700; }}
.inline-code {{
  font-family: var(--f-code);
  font-size: 0.88em;
  background: var(--c-page-bg);
  border: 1px solid var(--c-border);
  border-radius: 3px;
  padding: 1px 5px;
}}
.kbd {{
  display: inline-block;
  background: var(--c-page-bg);
  border: 1px solid var(--c-border);
  border-radius: 4px;
  padding: 1px 6px;
  font-family: var(--f-code);
  font-size: 11px;
}}
.badge {{
  display: inline-block;
  border-radius: 100px;
  padding: 1px 9px;
  font-size: 11px; font-weight: 600;
}}

.section-divider {{
  border: none; border-top: 1px solid var(--c-border);
  margin: 32px 0;
}}

/* ── 인쇄 스타일 ── */
@media print {{
  .doc-nav, .back-top {{ display: none; }}
  .doc-wrapper {{ padding: 0; box-shadow: none; }}
  .section-header {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  .doc-table thead tr {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  .terminal {{ border: 1px solid #ccc; }}
  .terminal-body {{ color: #000; background: #f5f5f5; }}
  .tip-card, .feature-card {{ box-shadow: none; border: 1px solid #ccc; }}
}}

/* ── 반응형 ── */
@media (max-width: 600px) {{
  .nav-links {{ display: none; }}
  .feature-grid {{ grid-template-columns: 1fr; }}
  .flow-steps {{ flex-direction: column; }}
  .flow-arrow {{ transform: rotate(90deg); }}
}}
"""


# ─────────────────────────────────────────────
# 7. HTML 조립
# ─────────────────────────────────────────────

def build_html(content_html: str, css: str, cfg: dict) -> str:
    meta = cfg["meta"]
    fonts_url = cfg["theme"]["fonts"].get("google_fonts_url", "")
    font_link  = (
        f'<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        f'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        f'  <link href="{fonts_url}" rel="stylesheet">'
    ) if fonts_url else ""

    back_top_html = ""
    if cfg["output"]["html"].get("back_to_top"):
        back_top_html = """
<button class="back-top" id="backTop" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>
<script>
  window.addEventListener('scroll', () => {
    document.getElementById('backTop').classList.toggle('visible', window.scrollY > 300);
  });
</script>"""

    return f"""<!DOCTYPE html>
<html lang="{meta.get('lang','ko')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{meta['name']}</title>
  {font_link}
  <style>
{css}
  /* back-top */
  .back-top {{
    position: fixed; bottom: 24px; right: 24px;
    width: 40px; height: 40px;
    background: var(--c-primary); color: var(--c-text-on-primary);
    border: none; border-radius: 8px;
    font-size: 16px; cursor: pointer;
    opacity: 0; transition: opacity .3s; z-index: 200;
  }}
  .back-top.visible {{ opacity: 1; }}
  </style>
</head>
<body>
{content_html}
{back_top_html}
</body>
</html>"""


# ─────────────────────────────────────────────
# 8. 메인
# ─────────────────────────────────────────────

def convert(content_path: str, template_path: str, output_path: str):
    print(f"[1/5] 설정 로드: {template_path}")
    cfg = load_config(template_path)

    print(f"[2/5] MD 파일 읽기: {content_path}")
    with open(content_path, encoding="utf-8") as f:
        md_text = f.read()

    print("[3/5] MD 파싱...")
    tokens = parse_md(md_text)
    print(f"      → {len(tokens)}개 토큰 생성")

    print("[4/5] HTML 변환...")
    nav_tokens = [t for t in tokens if t["type"] == "nav"]
    other_tokens = [t for t in tokens if t["type"] != "nav"]

    nav_html   = tokens_to_html(nav_tokens, cfg)
    body_html  = f'<div class="doc-wrapper">\n{tokens_to_html(other_tokens, cfg)}\n</div>'
    content_html = nav_html + "\n" + body_html

    css = generate_css(cfg)

    print("[5/5] HTML 파일 저장...")
    final_html = build_html(content_html, css, cfg)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(final_html)

    size_kb = Path(output_path).stat().st_size // 1024
    print(f"\n✅ 완료: {output_path} ({size_kb} KB)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MD + template.json → HTML")
    parser.add_argument("--content",  required=True, help="입력 .md 파일")
    parser.add_argument("--template", required=True, help="template.json 파일")
    parser.add_argument("--output",   required=True, help="출력 .html 파일")
    args = parser.parse_args()
    convert(args.content, args.template, args.output)
