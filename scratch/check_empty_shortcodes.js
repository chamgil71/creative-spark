import fs from "fs";
import path from "path";

const dir = "c:/ai/creative-spark/data/md_final";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

console.log("=== Empty Shortcode Detections ===");
for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), "utf8");
  
  // 정규식으로 비어 있는 숏코드 탐색 (예: ::: steps\r?\n:::)
  const matches = content.match(/:::\s*[a-zA-Z0-9_-]+\r?\n:::/g);
  if (matches) {
    console.log(`⚠️  Empty shortcode found in: ${f} (${matches.length} occurrences)`);
    console.log(matches);
  }
}
