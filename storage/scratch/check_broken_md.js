import fs from "fs";
import path from "path";

const dir = "c:/ai/creative-spark/data/md_final";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), "utf8");
  const lines = content.split(/\r?\n/).map(l => l.trim());
  
  let shortLinesCount = 0;
  let maxConsecutiveShortLines = 0;
  let currentConsecutive = 0;
  
  for (const l of lines) {
    // 6글자 이하인 짧은 라인 검사 (공백 제외)
    if (l.length > 0 && l.length <= 6) {
      currentConsecutive++;
      if (currentConsecutive > maxConsecutiveShortLines) {
        maxConsecutiveShortLines = currentConsecutive;
      }
      shortLinesCount++;
    } else if (l.length > 0) {
      currentConsecutive = 0;
    }
  }
  
  if (maxConsecutiveShortLines > 6) {
    console.log(`⚠️  Broken potential found in: ${f} (Max consecutive short lines: ${maxConsecutiveShortLines})`);
  }
}
