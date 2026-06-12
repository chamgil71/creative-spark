import fs from "node:fs";
import matter from "gray-matter";
import { marked } from "marked";

const raw = fs.readFileSync("md_src/guides/Cursor.md", "utf8");
const { data, content } = matter(raw);
const tokens = marked.lexer(content);
console.log(tokens.slice(0, 5));
