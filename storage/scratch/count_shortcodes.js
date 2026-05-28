import fs from "fs";
import path from "path";

const dir = "c:/ai/creative-spark/data/md_final";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

console.log("=== Shortcode Fence Counts per File ===");
for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), "utf8");
  const fences = (content.match(/:::/g) || []).length;
  console.log(`${f.padEnd(30)}: ${fences} fences`);
}
