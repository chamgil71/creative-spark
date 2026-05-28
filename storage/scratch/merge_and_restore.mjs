#!/usr/bin/env node
/**
 * merge_and_restore.mjs
 * 
 * data/md_temp/, data/mddata/, data/mdresult/ 내의 38개 도구 데이터를 분석 및 무손실 병합하고,
 * data/html_src1/의 원본 HTML의 프론트매터 속성(로고, 배지, 스탯, cta, done 등)을 100% 완벽하게 복원하여
 * 최종 고도화된 마크다운 파일을 새로운 폴더 data/md_final/ 에 자동 생성합니다.
 * 모든 병합 과정에서 6대 표준 키(label -> title 등) 규격을 완벽하게 강제 적용합니다.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlToMdString } from "../templates/html-to-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(WORKSPACE_DIR, "data");
const MD_FINAL_DIR = path.join(DATA_DIR, "md_final");

// 폴더 생성
if (!fs.existsSync(MD_FINAL_DIR)) {
  fs.mkdirSync(MD_FINAL_DIR, { recursive: true });
}

// file_report.json 로드
const reportPath = path.join(__dirname, "file_report.json");
if (!fs.existsSync(reportPath)) {
  console.error("❌ file_report.json이 존재하지 않습니다. 먼저 스캔 리포트를 생성해 주세요.");
  process.exit(1);
}
const fileReports = JSON.parse(fs.readFileSync(reportPath, "utf8"));

// ════════════════════════════════════════════════════════════════
//  1. 숏코드 파싱 및 직렬화 헬퍼 (6대 표준 규격 준수)
// ════════════════════════════════════════════════════════════════

function parseShortcode(blockText) {
  const lines = blockText.trim().split("\n");
  const typeMatch = lines[0].match(/^:::\s*([A-Za-z0-9_-]+)(?:\s+([^\n]+))?/);
  if (!typeMatch) return null;
  const type = typeMatch[1];
  const args = typeMatch[2] || "";
  
  const items = [];
  let currentItem = null;
  let currentKey = null;
  let inLiteralBlock = false;
  
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 멀티라인 리터럴 블록 내부 파싱 보장 (공백 4칸 들여쓰기 유지 시)
    if (inLiteralBlock && line.startsWith("    ")) {
      const val = line.slice(4);
      currentItem[currentKey] = (currentItem[currentKey] || "") + "\n" + val;
      continue;
    } else {
      inLiteralBlock = false;
    }
    
    // 1. 새 아이템 시작: - key: value
    const m1 = line.match(/^\s*-\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m1) {
      currentKey = m1[1];
      let val = m1[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      
      if (val === "|") {
        inLiteralBlock = true;
        currentItem = { [currentKey]: "" };
      } else {
        currentItem = { [currentKey]: val };
      }
      items.push(currentItem);
      continue;
    }
    
    // 2. 기존 아이템 내 새 키 (들여쓰기 + key: value)
    const m2 = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m2 && currentItem) {
      currentKey = m2[1];
      let val = m2[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      
      if (val === "|") {
        inLiteralBlock = true;
        currentItem[currentKey] = "";
      } else {
        currentItem[currentKey] = val;
      }
      continue;
    }
    
    // 3. 들여쓰기된 하이픈 리스트 항목 (들여쓰기 + - value)
    const m3 = line.match(/^\s+-\s+(.+)$/);
    if (m3 && currentItem && currentKey) {
      let val = m3[1].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      currentItem[currentKey] = (currentItem[currentKey] || "") + "\n- " + val;
      continue;
    }
    
    // 4. 들여쓰기된 연속 텍스트 (desc/note 멀티라인 등)
    if (line.match(/^\s+\S/) && currentItem && currentKey) {
      const val = line.trim();
      if (val === "|") {
        inLiteralBlock = true;
        continue;
      }
      currentItem[currentKey] = (currentItem[currentKey] || "") + "\n" + val;
    }
  }
  
  return { type, args, items };
}

function serializeShortcode({ type, args, items }) {
  // 6대 표준 규격에 맞게 인수 매개변수 적용
  let finalArgs = args ? args.trim() : "";
  if (type === "alert-box" && !finalArgs) {
    finalArgs = "tip"; // 기본타입 지정
  }
  
  const lines = finalArgs ? [`::: ${type} ${finalArgs}`] : [`::: ${type}`];
  
  for (const it of items) {
    // label -> title 통합 및 type 예약어 제거
    if (it.label && !it.title) {
      it.title = it.label;
      delete it.label;
    }
    if (it.name && !it.title) {
      it.title = it.name;
      delete it.name;
    }
    if (type === "alert-box" && it.type) {
      delete it.type;
    }
    
    // desc 대신 note 참조해야 하는 특정 숏코드 규칙 준수
    if (["plan-grid", "compare-2col"].includes(type)) {
      if (it.desc && !it.note) {
        it.note = it.desc;
        delete it.desc;
      }
    }
    
    let started = false;
    // 필드 표준 순서
    const sortedKeys = ["icon", "title", "tag", "desc", "meta", "note", "color", "featured"];
    const extraKeys = Object.keys(it).filter(k => !sortedKeys.includes(k) && k !== "label" && k !== "type" && k !== "name");
    const allKeys = [...sortedKeys.filter(k => it[k] !== undefined), ...extraKeys];
    
    for (const key of allKeys) {
      let val = String(it[key]).trim();
      if (!val) continue;
      
      // 멀티라인 필드의 파이프(|) 중복 렌더링 방지
      if (val.startsWith("|\n") || val.startsWith("|\r\n")) {
        val = val.replace(/^\|[\r\n]+/, "").trim();
      } else if (val === "|") {
        continue;
      }
      
      if (val.includes("\n")) {
        const valLines = val.split("\n");
        if (!started) {
          lines.push(`- ${key}: |`);
          started = true;
        } else {
          lines.push(`  ${key}: |`);
        }
        valLines.forEach(vl => {
          lines.push(`    ${vl}`);
        });
      } else {
        if (!started) {
          lines.push(`- ${key}: "${val.replace(/"/g, '\\"')}"`);
          started = true;
        } else {
          lines.push(`  ${key}: "${val.replace(/"/g, '\\"')}"`);
        }
      }
    }
  }
  
  lines.push(":::");
  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════
//  2. 지능형 단락/블록 분리 헬퍼
// ════════════════════════════════════════════════════════════════

function toBlocks(contentLines) {
  const blocks = [];
  let currentBlock = [];
  let inShortcode = false;
  
  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(":::")) {
      if (inShortcode) {
        currentBlock.push(line);
        blocks.push({ type: "shortcode", text: currentBlock.join("\n") });
        currentBlock = [];
        inShortcode = false;
      } else {
        if (currentBlock.length > 0) {
          blocks.push({ type: "text", text: currentBlock.join("\n") });
          currentBlock = [];
        }
        currentBlock.push(line);
        inShortcode = true;
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push({ type: inShortcode ? "shortcode" : "text", text: currentBlock.join("\n") });
  }
  return blocks;
}

// ════════════════════════════════════════════════════════════════
//  3. 마크다운 파서 및 대조 병합 (smartMerge)
// ════════════════════════════════════════════════════════════════

function parseMarkdown(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  let frontmatter = "";
  let body = content;
  if (fmMatch) {
    frontmatter = fmMatch[1];
    body = fmMatch[2];
  }
  
  const lines = body.split(/\r?\n/);
  const sections = [];
  let currentSection = { heading: "", contentLines: [] };
  let inShortcode = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(":::")) {
      inShortcode = !inShortcode;
    }
    
    // 숏코드 내부가 아닐 때만 # 헤더로 쪼갭니다.
    if (!inShortcode && trimmed.startsWith("#")) {
      if (currentSection.heading || currentSection.contentLines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { heading: trimmed, contentLines: [] };
    } else {
      currentSection.contentLines.push(line);
    }
  }
  if (currentSection.heading || currentSection.contentLines.length > 0) {
    sections.push(currentSection);
  }
  return { frontmatter, sections };
}

function mergeBlocks(blocksA, blocksB) {
  const merged = [...blocksA];
  
  const normCompare = (str) => str.replace(/[\s\u00a0\r\n]+/g, "").trim();
  
  for (const blockB of blocksB) {
    if (blockB.type === "shortcode") {
      const parsedB = parseShortcode(blockB.text);
      if (!parsedB) continue;
      
      const matchIndex = merged.findIndex(b => {
        if (b.type !== "shortcode") return false;
        const parsedA = parseShortcode(b.text);
        return parsedA && parsedA.type === parsedB.type;
      });
      
      if (matchIndex !== -1) {
        const parsedA = parseShortcode(merged[matchIndex].text);
        const mergedItems = [...parsedA.items];
        
        for (const itemB of parsedB.items) {
          const titleB = (itemB.title || itemB.label || itemB.name || "").trim();
          const matchItemIdx = mergedItems.findIndex(itemA => {
            const titleA = (itemA.title || itemA.label || itemA.name || "").trim();
            return titleA === titleB && titleB !== "";
          });
          
          if (matchItemIdx !== -1) {
            // 기존 아이템 병합 및 더 상세한 속성 보존
            mergedItems[matchItemIdx] = { ...itemB, ...mergedItems[matchItemIdx] };
            for (const key of Object.keys(itemB)) {
              const valB = String(itemB[key]).trim();
              const valA = String(mergedItems[matchItemIdx][key] || "").trim();
              if (valB.length > valA.length) {
                mergedItems[matchItemIdx][key] = itemB[key];
              }
            }
          } else {
            mergedItems.push(itemB);
          }
        }
        
        parsedA.items = mergedItems;
        merged[matchIndex] = {
          type: "shortcode",
          text: serializeShortcode(parsedA)
        };
      } else {
        merged.push({
          type: "shortcode",
          text: serializeShortcode(parsedB)
        });
      }
    } else {
      const textB = blockB.text.trim();
      if (!textB) continue;
      
      const normB = normCompare(textB);
      if (!normB) continue;
      
      const exists = merged.some(b => {
        const normA = normCompare(b.text);
        return normA.includes(normB) || normB.includes(normA);
      });
      
      if (!exists) {
        merged.push(blockB);
      }
    }
  }
  return merged;
}

function mergeBody(bodyTextA, bodyTextB) {
  const { sections: sectionsA } = parseMarkdown(bodyTextA);
  const { sections: sectionsB } = parseMarkdown(bodyTextB);
  
  const mergedSections = [...sectionsA];
  
  for (const secB of sectionsB) {
    const cleanHeadingB = secB.heading.replace(/^[#\s\d.]+/g, "").trim();
    if (!cleanHeadingB) {
      // 도입부 (헤더 없는 첫 섹션) 병합
      if (mergedSections.length > 0 && mergedSections[0].heading === "") {
        const blocksA = toBlocks(mergedSections[0].contentLines);
        const blocksB = toBlocks(secB.contentLines);
        const mergedBlocks = mergeBlocks(blocksA, blocksB);
        mergedSections[0].contentLines = mergedBlocks.map(b => b.text);
      }
      continue;
    }
    
    const matchIdx = mergedSections.findIndex(secA => {
      const cleanHeadingA = secA.heading.replace(/^[#\s\d.]+/g, "").trim();
      return cleanHeadingA === cleanHeadingB;
    });
    
    if (matchIdx !== -1) {
      const blocksA = toBlocks(mergedSections[matchIdx].contentLines);
      const blocksB = toBlocks(secB.contentLines);
      const mergedBlocks = mergeBlocks(blocksA, blocksB);
      mergedSections[matchIdx].contentLines = mergedBlocks.map(b => b.text);
    } else {
      // HTML 원본(base)에 존재하지 않는 엉뚱한 헤딩(H1)이 기존 마크다운에 존재할 경우,
      // 이는 이전에 잘못 파싱되어 밖으로 튀어나온 찌꺼기일 가능성이 100%이므로 병합하지 않고 무시합니다.
      console.log(`    ⚠️ HTML 원본에 매칭되지 않는 섹션은 무시합니다: "${secB.heading}"`);
    }
  }
  
  return mergedSections.map(sec => {
    const lines = [];
    if (sec.heading) {
      lines.push(sec.heading);
    }
    const content = sec.contentLines.join("\n").trim();
    if (content) lines.push(content);
    return lines.join("\n");
  }).join("\n\n").trim();
}

// ════════════════════════════════════════════════════════════════
//  4. 메인 실행 루프
// ════════════════════════════════════════════════════════════════

console.log("🚀 [시작] 데이터 통합 및 원본 HTML 속성 복원 파이프라인 가동...");

let successCount = 0;
let errorCount = 0;

for (const tool of fileReports) {
  try {
    const { key, baseName, html, mddata, md_temp, mdresult } = tool;
    console.log(`\n📦 도구 처리 중: ${baseName} (${key})`);
    
    let baseMdContent = "";
    
    if (html !== "MISSING") {
      // 36개 HTML 기반 도구
      const htmlPath = path.join(DATA_DIR, "html_src1", html);
      console.log(`  - 1단계: HTML 에서 Frontmatter 및 숏코드 기본형 역파싱 복원... (${html})`);
      baseMdContent = htmlToMdString(htmlPath);
    } else {
      // 2개 순수 마크다운 도구 (Cursor, terminal-ai-tools)
      console.log(`  - 1단계: HTML 없음 (마크다운 전용 도구). 기존 데이터 로딩...`);
      const candidates = [mdresult, md_temp, mddata];
      for (const cand of candidates) {
        if (cand && cand !== "MISSING") {
          const folder = cand === mdresult ? "mdresult" : cand === md_temp ? "md_temp" : "mddata";
          const p = path.join(DATA_DIR, folder, cand);
          if (fs.existsSync(p)) {
            baseMdContent = fs.readFileSync(p, "utf8");
            break;
          }
        }
      }
    }
    
    if (!baseMdContent) {
      console.warn(`  ⚠️ 기본 마크다운 컨텐츠를 불러올 수 없습니다. 건너뜁니다.`);
      errorCount++;
      continue;
    }
    
    // 2단계: 기존 마크다운 폴더들의 내용 병합 (무손실 누적)
    let currentMergedContent = baseMdContent;
    
    if (html === "MISSING") {
      console.log(`  - 2단계: HTML 없음 (마크다운 전용 도구). 기존 데이터 무손실 병합 구동...`);
      const folders = ["mdresult", "md_temp", "mddata"];
      for (const folder of folders) {
        const fileProp = tool[folder === "mdresult" ? "mdresult" : folder === "md_temp" ? "md_temp" : "mddata"];
        if (fileProp && fileProp !== "MISSING") {
          const filePath = path.join(DATA_DIR, folder, fileProp);
          if (fs.existsSync(filePath)) {
            console.log(`    - ${folder}/${fileProp} 와 무손실 스마트 본문 병합 중...`);
            const existingContent = fs.readFileSync(filePath, "utf8");
            
            const fmBase = parseMarkdown(currentMergedContent).frontmatter;
            const bodyBase = parseMarkdown(currentMergedContent).sections.map(s => {
              const l = [];
              if (s.heading) l.push(s.heading);
              const c = s.contentLines.join("\n").trim();
              if (c) l.push(c);
              return l.join("\n");
            }).join("\n\n");
            
            const bodyExisting = parseMarkdown(existingContent).sections.map(s => {
              const l = [];
              if (s.heading) l.push(s.heading);
              const c = s.contentLines.join("\n").trim();
              if (c) l.push(c);
              return l.join("\n");
            }).join("\n\n");
            
            const mergedBody = mergeBody(bodyBase, bodyExisting);
            currentMergedContent = `---\n${fmBase}\n---\n\n${mergedBody}`;
          }
        }
      }
    } else {
      console.log(`  - 2단계: HTML 기반 무결점 마크다운이 복원되었으므로 오염된 기존 md 병합 우회 (찌꺼기 유입 차단)`);
    }
    
    // 3단계: 최종 6대 키 강제 적용 & 미세 보정
    console.log("  - 3단계: 6대 표준 키 문법 교정 및 미세 보정 적용...");
    const parsedFinal = parseMarkdown(currentMergedContent);
    const correctedSections = parsedFinal.sections.map(sec => {
      const blocks = toBlocks(sec.contentLines);
      const correctedBlocks = blocks.map(b => {
        if (b.type === "shortcode") {
          const sc = parseShortcode(b.text);
          if (sc) {
            return serializeShortcode(sc);
          }
        }
        return b.text;
      });
      
      const lines = [];
      if (sec.heading) lines.push(sec.heading);
      const c = correctedBlocks.join("\n").trim();
      if (c) lines.push(c);
      return lines.join("\n");
    });
    
    const finalMdText = `---\n${parsedFinal.frontmatter.trim()}\n---\n\n${correctedSections.join("\n\n").trim()}`;
    
    // 4단계: 저장
    const destFileName = baseName + ".md";
    const destPath = path.join(MD_FINAL_DIR, destFileName);
    fs.writeFileSync(destPath, finalMdText, "utf8");
    console.log(`  - 4단계: 저장 완료 -> data/md_final/${destFileName}`);
    successCount++;
  } catch (err) {
    console.error(`❌ 에러 발생 (${tool.baseName}):`, err.message);
    errorCount++;
  }
}

console.log("\n════════════════════════════════════════════════════════════════");
console.log(`🏁 [완료] 파이프라인 구동 완료.`);
console.log(`   - 성공: ${successCount} 개 도구`);
console.log(`   - 실패/오류: ${errorCount} 개 도구`);
console.log("════════════════════════════════════════════════════════════════");
