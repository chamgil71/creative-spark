import { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Helper to recursively find markdown files
function getMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getMarkdownFiles(filePath, baseDir));
    } else if (file.toLowerCase().endsWith(".md")) {
      results.push(path.relative(baseDir, filePath));
    }
  });
  return results;
}

// Generate simple Markdown Table of Contents from markdown text
function generateTOC(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const tocLines: string[] = [];
  let inFrontmatter = false;
  let skippedFrontmatter = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "---") {
      if (!inFrontmatter && !skippedFrontmatter) {
        inFrontmatter = true;
      } else if (inFrontmatter) {
        inFrontmatter = false;
        skippedFrontmatter = true;
      }
      continue;
    }
    if (inFrontmatter) continue;

    // Detect headers
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);

    if (h1Match) {
      const title = h1Match[1].trim();
      const anchor = title.toLowerCase().replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s-]/g, "").replace(/\s+/g, "-");
      tocLines.push(`- [${title}](#${anchor})`);
    } else if (h2Match) {
      const title = h2Match[1].trim();
      const anchor = title.toLowerCase().replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s-]/g, "").replace(/\s+/g, "-");
      tocLines.push(`  - [${title}](#${anchor})`);
    }
  }

  if (tocLines.length === 0) return "";
  return "\n## 📋 목차\n" + tocLines.join("\n") + "\n\n---\n";
}

// Inject TOC right after frontmatter
function injectTOC(markdown: string): string {
  const parts = markdown.split("---");
  if (parts.length >= 3) {
    const toc = generateTOC(markdown);
    // parts[0] is empty before first ---, parts[1] is frontmatter content
    // We insert TOC at the start of parts[2]
    parts[2] = toc + parts[2];
    return parts.join("---");
  }
  return generateTOC(markdown) + markdown;
}

export function viteApiPlugin(): Plugin {
  return {
    name: "vite-api-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        if (!url.pathname.startsWith("/api/")) {
          return next();
        }

        const method = req.method;
        const rootDir = process.cwd();
        const mdSrcDir = path.join(rootDir, "md_src");
        const scratchDir = path.join(rootDir, "scratch");

        if (!fs.existsSync(scratchDir)) {
          fs.mkdirSync(scratchDir, { recursive: true });
        }

        try {
          // 1. GET /api/list-styles
          if (url.pathname === "/api/list-styles" && method === "GET") {
            const stylesPath = path.join(rootDir, "config", "styles.json");
            if (fs.existsSync(stylesPath)) {
              const src = fs.readFileSync(stylesPath, "utf8")
                .replace(/\/\/[^\n]*/g, "")
                .replace(/\/\*[\s\S]*?\*\//g, "");
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify(JSON.parse(src)));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "styles.json not found" }));
            }
            return;
          }

          // 1-2. POST /api/save-styles
          if (url.pathname === "/api/save-styles" && method === "POST") {
            const { styles } = await getBody();
            if (!styles || typeof styles !== "object") {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing or invalid styles object" }));
              return;
            }
            const stylesPath = path.join(rootDir, "config", "styles.json");
            fs.writeFileSync(stylesPath, JSON.stringify(styles, null, 2), "utf8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ success: true, message: "테마가 성공적으로 저장되었습니다." }));
            return;
          }

          // 2. GET /api/list-files
          if (url.pathname === "/api/list-files" && method === "GET") {
            const files = getMarkdownFiles(mdSrcDir);
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ files }));
            return;
          }

          // 3. GET /api/load-file?path=...
          if (url.pathname === "/api/load-file" && method === "GET") {
            const relPath = url.searchParams.get("path");
            if (!relPath) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing path query parameter" }));
              return;
            }
            const safePath = path.join(mdSrcDir, path.normalize(relPath).replace(/^(\.\.[\/\\])+/, ""));
            if (fs.existsSync(safePath) && safePath.startsWith(mdSrcDir)) {
              const content = fs.readFileSync(safePath, "utf8");
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ content }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "File not found" }));
            }
            return;
          }

          // Helper to parse JSON body
          const getBody = (): Promise<any> => {
            return new Promise((resolve, reject) => {
              let body = "";
              req.on("data", (chunk) => { body += chunk; });
              req.on("end", () => {
                try {
                  resolve(body ? JSON.parse(body) : {});
                } catch (e) {
                  reject(new Error("Invalid JSON body"));
                }
              });
            });
          };

          // 4. POST /api/preview
          if (url.pathname === "/api/preview" && method === "POST") {
            const { markdown, mode, style } = await getBody();
            if (!markdown || !mode) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing markdown or mode parameter" }));
              return;
            }

            const tempMd = path.join(scratchDir, `preview_${Date.now()}.md`);
            const tempHtml = path.join(scratchDir, `preview_${Date.now()}.html`);

            fs.writeFileSync(tempMd, markdown, "utf8");

            try {
              let cmd = "";
              const styleFlag = style ? ` --style ${style}` : "";
              if (mode === "html") {
                cmd = `node scripts/build-guide.mjs "${tempMd}" --out "${tempHtml}"${styleFlag}`;
              } else if (mode === "presentation") {
                cmd = `node scripts/build-presentation.mjs "${tempMd}" "${tempHtml}"${styleFlag}`;
              } else {
                throw new Error("Invalid preview mode");
              }

              await execAsync(cmd);

              if (fs.existsSync(tempHtml)) {
                const htmlContent = fs.readFileSync(tempHtml, "utf8");
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end(htmlContent);
              } else {
                throw new Error("Preview generation failed - output file missing");
              }
            } finally {
              // Clean up temp files
              try { if (fs.existsSync(tempMd)) fs.unlinkSync(tempMd); } catch {}
              try { if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml); } catch {}
            }
            return;
          }

          // 5. POST /api/convert
          if (url.pathname === "/api/convert" && method === "POST") {
            const { markdown, format, filename, style, options } = await getBody();
            if (!markdown || !format) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing markdown or format parameter" }));
              return;
            }

            // Apply options on markdown text
            let processedMarkdown = markdown;
            if (options && options.toc && format === "html") {
              processedMarkdown = injectTOC(markdown);
            }

            const tempMd = path.join(scratchDir, `convert_${Date.now()}.md`);
            const outExt = format === "pptx" ? "pptx" : "html";
            const tempOut = path.join(scratchDir, `convert_${Date.now()}.${outExt}`);

            fs.writeFileSync(tempMd, processedMarkdown, "utf8");

            try {
              let cmd = "";
              const styleFlag = style ? ` --style ${style}` : "";
              
              if (format === "html") {
                cmd = `node scripts/build-guide.mjs "${tempMd}" --out "${tempOut}"${styleFlag}`;
              } else if (format === "presentation") {
                cmd = `node scripts/build-presentation.mjs "${tempMd}" "${tempOut}"${styleFlag}`;
              } else if (format === "pptx") {
                const noCoverFlag = (options && options.noCover) ? " --no-cover" : "";
                cmd = `node scripts/md-to-pptx.mjs "${tempMd}" --out "${tempOut}"${styleFlag}${noCoverFlag}`;
              } else {
                throw new Error("Invalid format");
              }

              await execAsync(cmd);

              if (fs.existsSync(tempOut)) {
                const downloadName = filename || `converted_file.${outExt}`;
                const contentType = format === "pptx" 
                  ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  : "text/html; charset=utf-8";

                res.setHeader("Content-Type", contentType);
                res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadName)}"`);
                
                const fileStream = fs.createReadStream(tempOut);
                fileStream.pipe(res);
              } else {
                throw new Error("Convert failed - output file missing");
              }
            } finally {
              // Clean up temp files after a slight delay to allow streaming
              setTimeout(() => {
                try { if (fs.existsSync(tempMd)) fs.unlinkSync(tempMd); } catch {}
                try { if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut); } catch {}
              }, 5000);
            }
            return;
          }

          // 6. POST /api/save-generate
          if (url.pathname === "/api/save-generate" && method === "POST") {
            const { markdown, filename, outputPath, saveOption, formats, style, options } = await getBody();
            if (!markdown || !filename || !formats || !Array.isArray(formats)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing required parameters: markdown, filename, formats" }));
              return;
            }

            // Ensure filename has .md extension
            let baseName = filename.replace(/\.[^/.]+$/, "");
            const mdFilename = baseName + ".md";

            // Determine output directory
            let outDir = rootDir;
            if (outputPath) {
              if (path.isAbsolute(outputPath)) {
                outDir = outputPath;
              } else {
                outDir = path.join(rootDir, outputPath);
              }
            } else {
              outDir = path.join(rootDir, "dist-pptx");
            }

            // Create output directory if not exists
            if (!fs.existsSync(outDir)) {
              fs.mkdirSync(outDir, { recursive: true });
            }

            const savedFiles: string[] = [];

            // 1. If saveOption is guideHub, save to md_src/guides and trigger build-publish
            if (saveOption === "guideHub") {
              const guideMdPath = path.join(mdSrcDir, "guides", mdFilename);
              fs.mkdirSync(path.dirname(guideMdPath), { recursive: true });
              fs.writeFileSync(guideMdPath, markdown, "utf8");
              savedFiles.push(guideMdPath);
              
              // Run build-publish to compile guide hub & update standalone.html
              try {
                console.log(`[API] Rebuilding guide hub for ${mdFilename}...`);
                await execAsync("node scripts/build-publish.mjs");
              } catch (buildErr: any) {
                console.error("Error building guides:", buildErr);
                // Continue despite build error so files are still created in output directory
              }
            }

            // 2. Generate formats in the output directory
            const tempMd = path.join(scratchDir, `save_gen_${Date.now()}.md`);
            
            // Inject TOC for HTML format if selected
            let processedMarkdown = markdown;
            if (options && options.toc) {
              processedMarkdown = injectTOC(markdown);
            }
            fs.writeFileSync(tempMd, processedMarkdown, "utf8");

            try {
              const styleFlag = style ? ` --style ${style}` : "";
              
              for (const format of formats) {
                let outFilename = "";
                let cmd = "";
                
                if (format === "html") {
                  outFilename = `${baseName}.html`;
                  const outPath = path.join(outDir, outFilename);
                  cmd = `node scripts/build-guide.mjs "${tempMd}" --out "${outPath}"${styleFlag}`;
                  await execAsync(cmd);
                  savedFiles.push(outPath);
                } else if (format === "presentation") {
                  outFilename = `${baseName}_presentation.html`;
                  const outPath = path.join(outDir, outFilename);
                  cmd = `node scripts/build-presentation.mjs "${tempMd}" "${outPath}"${styleFlag}`;
                  await execAsync(cmd);
                  savedFiles.push(outPath);
                } else if (format === "pptx") {
                  outFilename = `${baseName}.pptx`;
                  const outPath = path.join(outDir, outFilename);
                  const noCoverFlag = (options && options.noCover) ? " --no-cover" : "";
                  cmd = `node scripts/md-to-pptx.mjs "${tempMd}" --out "${outPath}"${styleFlag}${noCoverFlag}`;
                  await execAsync(cmd);
                  savedFiles.push(outPath);
                }
              }
            } finally {
              try { if (fs.existsSync(tempMd)) fs.unlinkSync(tempMd); } catch {}
            }

            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({
              success: true,
              savedFiles,
              message: `성공적으로 파일이 생성 및 저장되었습니다.\n저장 경로: ${outDir}\n생성 파일: ${savedFiles.map(f => path.basename(f)).join(", ")}`
            }));
            return;
          }

          // Fallthrough
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Not Found" }));

        } catch (e: any) {
          console.error("API error:", e);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: e.message || "Internal Server Error" }));
        }
      });
    }
  };
}
