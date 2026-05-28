import fs from "node:fs";
import { load } from "cheerio";

const raw = fs.readFileSync("public/ai_guide_standalone.html", "utf8");
const $ = load(raw);
const appdataText = $("#appdata").text();
const data = JSON.parse(appdataText);

const cl = data.guideContents["claude-code"];
if (cl) {
  fs.writeFileSync("scratch/legacy_claude_code.json", JSON.stringify(cl, null, 2), "utf8");
  console.log("✅ Extracted legacy claude-code content!");
} else {
  console.log("❌ 'claude-code' not found in guideContents!");
  console.log("Available keys:", Object.keys(data.guideContents));
}
