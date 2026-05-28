import fs from "fs";
import path from "path";

const workspace = "c:\\ai\\creative-spark";
const dirs = {
  mddata: path.join(workspace, "data", "mddata"),
  md_temp: path.join(workspace, "data", "md_temp"),
  mdresult: path.join(workspace, "data", "mdresult"),
  html_src1: path.join(workspace, "data", "html_src1"),
};

// Scan files in each directory
function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".md") || f.endsWith(".html") || f.endsWith(".htm"));
}

const fileMap = {}; // filename (lowercase) -> { mddata: string, md_temp: string, mdresult: string, html_src1: string }

function register(dirKey, files) {
  for (const f of files) {
    const ext = path.extname(f);
    const base = path.basename(f, ext);
    const key = base.toLowerCase();
    if (!fileMap[key]) {
      fileMap[key] = { baseName: base, mddata: null, md_temp: null, mdresult: null, html_src1: null };
    }
    fileMap[key][dirKey] = f;
  }
}

register("mddata", getFiles(dirs.mddata));
register("md_temp", getFiles(dirs.md_temp));
register("mdresult", getFiles(dirs.mdresult));
register("html_src1", getFiles(dirs.html_src1));

console.log("=== FILE ANALYTICS ===");
console.log(`Total unique tool keys: ${Object.keys(fileMap).length}`);

const report = [];
for (const [key, info] of Object.entries(fileMap)) {
  const mddataPath = info.mddata ? path.join(dirs.mddata, info.mddata) : null;
  const md_tempPath = info.md_temp ? path.join(dirs.md_temp, info.md_temp) : null;
  const mdresultPath = info.mdresult ? path.join(dirs.mdresult, info.mdresult) : null;
  
  const mddataSize = mddataPath ? fs.statSync(mddataPath).size : 0;
  const md_tempSize = md_tempPath ? fs.statSync(md_tempPath).size : 0;
  const mdresultSize = mdresultPath ? fs.statSync(mdresultPath).size : 0;

  report.push({
    key,
    baseName: info.baseName,
    mddata: info.mddata || "MISSING",
    mddataSize,
    md_temp: info.md_temp || "MISSING",
    md_tempSize,
    mdresult: info.mdresult || "MISSING",
    mdresultSize,
    html: info.html_src1 || "MISSING"
  });
}

// Output report to a JSON file
fs.mkdirSync(path.join(workspace, "scratch"), { recursive: true });
fs.writeFileSync(
  path.join(workspace, "scratch", "file_report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("Analysis complete. Report saved to scratch/file_report.json");
