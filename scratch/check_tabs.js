import fs from "fs";
import path from "path";

const dir = "c:/ai/creative-spark/data/md_final";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

console.log("=== Markdown Files with ::: tabs ===");
for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), "utf8");
  if (content.includes("::: tabs")) {
    console.log(`📌 ${f}`);
  }
}
