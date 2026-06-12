#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPresentationHtml } from "./build-presentation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DATA_FILE = path.join(ROOT, "src/data/guides.json");
const OUT_FILE = path.join(ROOT, "public", "presentation", "guides-unified-presentation.html");

if (!fs.existsSync(DATA_FILE)) {
  console.error(`❌ 에러: guides.json 파일을 찾을 수 없습니다: ${DATA_FILE}`);
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const files = [];

  for (const cat of data.categories) {
    console.log(`📂 카테고리 로드 중: ${cat.label} (ID: ${cat.id})`);
    for (const g of cat.guides) {
      // file 필드는 "chatGPT.html"과 같은 형태이므로 확장자를 .md로 변경
      const mdFilename = g.file.replace(/\.html$/, ".md");
      const mdPath = path.join(ROOT, "md_src", "guides", mdFilename);
      
      if (fs.existsSync(mdPath)) {
        files.push(mdPath);
        console.log(`  📄 추가됨: ${mdFilename} (${g.title})`);
      } else {
        console.warn(`  ⚠️ 경고: 마크다운 파일이 존재하지 않습니다: ${mdPath}`);
      }
    }
  }

  if (files.length === 0) {
    console.error("❌ 에러: 빌드할 마크다운 파일을 발견하지 못했습니다.");
    process.exit(1);
  }

  console.log(`🚀 총 ${files.length}개의 가이드 마크다운 파일 병합 빌드 시작...`);

  // buildPresentationHtml 함수 호출하여 단일 HTML 슬라이드로 빌드
  const { html } = buildPresentationHtml(files);

  // 출력 경로 생성 및 저장
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  
  // Safe-Write
  try {
    if (fs.existsSync(OUT_FILE)) {
      fs.unlinkSync(OUT_FILE);
    }
  } catch (err) {
    // 무시
  }
  
  fs.writeFileSync(OUT_FILE, html, "utf8");
  console.log(`\n✅ 단일 횡 HTML 가이드 프레젠테이션 파일이 성공적으로 생성되었습니다:`);
  console.log(`👉 경로: ${OUT_FILE}`);
  console.log(`👉 크기: ${(html.length / 1024).toFixed(1)} KB`);

} catch (err) {
  console.error("❌ 에러 발생:", err.message);
  process.exit(1);
}
