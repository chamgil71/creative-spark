import fs from "fs";
import path from "path";

const workspace = "c:\\ai\\creative-spark";
const dirs = {
  mddata: path.join(workspace, "data", "mddata"),
  md_temp: path.join(workspace, "data", "md_temp"),
  mdresult: path.join(workspace, "data", "mdresult"),
};

const fileReport = JSON.parse(fs.readFileSync(path.join(workspace, "scratch", "file_report.json"), "utf8"));

const results = [];

for (const entry of fileReport) {
  const contents = {};
  if (entry.mddata !== "MISSING") {
    contents.mddata = fs.readFileSync(path.join(dirs.mddata, entry.mddata), "utf8");
  }
  if (entry.md_temp !== "MISSING") {
    contents.md_temp = fs.readFileSync(path.join(dirs.md_temp, entry.md_temp), "utf8");
  }
  if (entry.mdresult !== "MISSING") {
    contents.mdresult = fs.readFileSync(path.join(dirs.mdresult, entry.mdresult), "utf8");
  }

  const keys = Object.keys(contents);
  const diffs = {};

  if (keys.length > 1) {
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const k1 = keys[i];
        const k2 = keys[j];
        const same = contents[k1].trim() === contents[k2].trim();
        diffs[`${k1}_vs_${k2}`] = same ? "IDENTICAL" : `DIFFERENT (Sizes: ${contents[k1].length} vs ${contents[k2].length})`;
      }
    }
  }

  results.push({
    key: entry.key,
    baseName: entry.baseName,
    diffs,
    hasHtml: entry.html !== "MISSING"
  });
}

fs.writeFileSync(
  path.join(workspace, "scratch", "diff_report.json"),
  JSON.stringify(results, null, 2),
  "utf8"
);
console.log("Comparison report saved to scratch/diff_report.json");
