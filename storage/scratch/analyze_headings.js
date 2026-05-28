import fs from "fs";
import path from "path";

const workspace = "c:\\ai\\creative-spark";
const dirs = {
  mddata: path.join(workspace, "data", "mddata"),
  md_temp: path.join(workspace, "data", "md_temp"),
  mdresult: path.join(workspace, "data", "mdresult"),
};

const fileReport = JSON.parse(fs.readFileSync(path.join(workspace, "scratch", "file_report.json"), "utf8"));

function getHeadings(content) {
  if (!content) return [];
  return content.split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith("#"))
    .map(line => line.replace(/^#+\s*/, "").trim());
}

const headingDiffs = {};

for (const entry of fileReport) {
  const headings = {};
  if (entry.mddata !== "MISSING") {
    headings.mddata = getHeadings(fs.readFileSync(path.join(dirs.mddata, entry.mddata), "utf8"));
  }
  if (entry.md_temp !== "MISSING") {
    headings.md_temp = getHeadings(fs.readFileSync(path.join(dirs.md_temp, entry.md_temp), "utf8"));
  }
  if (entry.mdresult !== "MISSING") {
    headings.mdresult = getHeadings(fs.readFileSync(path.join(dirs.mdresult, entry.mdresult), "utf8"));
  }

  headingDiffs[entry.key] = {
    baseName: entry.baseName,
    mddata: headings.mddata || [],
    md_temp: headings.md_temp || [],
    mdresult: headings.mdresult || []
  };
}

fs.writeFileSync(
  path.join(workspace, "scratch", "heading_report.json"),
  JSON.stringify(headingDiffs, null, 2),
  "utf8"
);
console.log("Heading report saved to scratch/heading_report.json");
