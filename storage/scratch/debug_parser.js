import fs from "node:fs";
import matter from "gray-matter";

const raw = fs.readFileSync("docs/examples/showcase.md", "utf8");
const { content } = matter(raw);

const re = /^:::\s*([A-Za-z0-9_-]+)(?:\s+([^\n]+))?\s*\n([\s\S]*?)\n:::\s*$/gm;
let m;
while ((m = re.exec(content)) !== null) {
  if (m[1] === "icon-grid") {
    console.log("=== REGEX MATCH GROUPS ===");
    console.log("Group 0 (Full Match):", JSON.stringify(m[0]));
    console.log("Group 1 (Type):", JSON.stringify(m[1]));
    console.log("Group 2 (Args):", JSON.stringify(m[2]));
    console.log("Group 3 (Body):", JSON.stringify(m[3]));
    console.log("==========================");
  }
}
