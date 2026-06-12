import fs from "node:fs";
import matter from "gray-matter";
import { marked } from "marked";

const raw = fs.readFileSync("md_src/guides/Cursor.md", "utf8").replace(/\r\n/g, "\n");
const { data: fm, content } = matter(raw);

let processedContent = content.replace(/^:::\s*([A-Za-z0-9_-]+)(?:[ \t]+([^\r\n]+))?[ \t]*\r?\n([\s\S]*?)(?:\r?\n|^):::[ \t]*$/gm, (_, type, args, body) => {
  return ""; // simplified for testing
});

const tokens = marked.lexer(processedContent);
let currentSlide = null;
let isAfterSplit = false;
const slides = [];

for (const tok of tokens) {
  console.log(`Processing token: ${tok.type}, currentSlide is null? ${currentSlide === null}`);
  if (tok.type === "heading" && tok.depth === 1) {
    if (currentSlide && (currentSlide.body.trim() || currentSlide.title.trim())) {
      slides.push(currentSlide);
    }
    const title = marked.parser([{type: 'paragraph', tokens: tok.tokens}]).replace(/^<p>|<\/p>\n?$/g, "");
    currentSlide = {
      type: "cover",
      title,
      body: "",
    };
    isAfterSplit = false;
  } else if (tok.type === "heading" && tok.depth === 2) {
    if (currentSlide && (currentSlide.body.trim() || currentSlide.title.trim())) {
      slides.push(currentSlide);
    }
    const title = marked.parser([{type: 'paragraph', tokens: tok.tokens}]).replace(/^<p>|<\/p>\n?$/g, "");
    currentSlide = {
      type: "content",
      title,
    };
    isAfterSplit = false;
  } else if (tok.type === "hr") {
    if (currentSlide && (currentSlide.body.trim() || currentSlide.title.trim())) {
      slides.push(currentSlide);
    }
    currentSlide = null;
    isAfterSplit = true;
  } else if (tok.type === "space") {
    // ignore
  } else {
    if (!currentSlide) {
      if (!isAfterSplit) {
        currentSlide = {
          type: "cover",
          title: fm.title || "Untitled",
          body: fm.subtitle || fm.description || "",
        };
      } else {
        currentSlide = {
          type: "content",
          title: "",
          body: "",
        };
      }
    }
    currentSlide.body = (currentSlide.body || "") + marked.parser([tok]);
  }
}
if (currentSlide && (currentSlide.body.trim() || currentSlide.title.trim())) {
  slides.push(currentSlide);
}

console.log("=== Compiled Slides ===");
slides.forEach((s, i) => {
  console.log(`Slide ${i+1}: type=${s.type}, title="${s.title}", body_length=${s.body?.length}`);
  console.log(`  body: ${s.body?.slice(0, 100)}...`);
});
