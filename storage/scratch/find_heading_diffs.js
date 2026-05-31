import fs from "fs";
import path from "path";

const workspace = "c:\\ai\\creative-spark";
const report = JSON.parse(fs.readFileSync(path.join(workspace, "scratch", "heading_report.json"), "utf8"));

console.log("=== HEADING DIFFERENCES ===");

for (const [key, data] of Object.entries(report)) {
  const s1 = JSON.stringify(data.mddata);
  const s2 = JSON.stringify(data.md_temp);
  const s3 = JSON.stringify(data.mdresult);

  if (s1 !== s2 || s2 !== s3) {
    console.log(`\nTool: ${data.baseName} (${key})`);
    console.log(` - mddata:   ${data.mddata.length} headings [${data.mddata.slice(0, 3).join(", ")}...]`);
    console.log(` - md_temp:  ${data.md_temp.length} headings [${data.md_temp.slice(0, 3).join(", ")}...]`);
    console.log(` - mdresult: ${data.mdresult.length} headings [${data.mdresult.slice(0, 3).join(", ")}...]`);
  }
}
