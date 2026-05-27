import fs from "node:fs";
import matter from "gray-matter";

const inputPath = "data/md_final/Everything.md";
const raw = fs.readFileSync(inputPath, "utf8");
const { data: fm, content } = matter(raw);

console.log("--- Content Length:", content.length);

// 수정한 정규식
const regex = /^:::\s*([A-Za-z0-9_-]+)(?:[ \t]+([^\r\n]+))?[ \t]*\r?\n([\s\S]*?)(?:\r?\n|^):::[ \t]*$/gm;

let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  console.log(`\nMatch #${count}:`);
  console.log("Type:", match[1]);
  console.log("Args:", match[2]);
  console.log("Body length:", match[3].length);
  console.log("Body excerpt:", JSON.stringify(match[3]));
}

console.log(`\nTotal matched: ${count}`);
