/**
 * Generates docs/ADIGATOR_COMPLETE_WEBSITE_DOCUMENTATION.pdf
 * Uses system Microsoft Edge + puppeteer-core (no Chromium download).
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mdPath = join(root, "docs", "ADIGATOR_COMPLETE_WEBSITE_DOCUMENTATION.md");
const htmlPath = join(root, "docs", "ADIGATOR_COMPLETE_WEBSITE_DOCUMENTATION.print.html");
const pdfPath = join(root, "docs", "ADIGATOR_COMPLETE_WEBSITE_DOCUMENTATION.pdf");

const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
].filter(Boolean);

function findBrowser() {
  return EDGE_PATHS.find((p) => existsSync(p)) || null;
}

function markdownToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let inCode = false;
  let inTable = false;
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) {
        closeList();
        out.push('<pre class="code-block">');
        inCode = true;
      } else {
        out.push("</pre>");
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      out.push(line.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("#### ")) {
      closeList();
      out.push(`<h4>${escapeHtml(line.slice(5))}</h4>`);
      continue;
    }

    if (line.startsWith("|") && line.includes("|")) {
      closeList();
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (!inTable) {
        out.push('<table class="doc-table">');
        inTable = true;
      }
      if (cells.every((c) => /^-+$/.test(c.replace(/:/g, "")))) {
        continue;
      }
      const tag = out[out.length - 1]?.includes("<table") ? "th" : "td";
      const rowTag = tag === "th" ? "thead><tr" : "tr";
      if (tag === "th") out.push(`<${rowTag}>`);
      else if (!out[out.length - 1]?.endsWith("</tr>") && !out[out.length - 1]?.includes("<tr")) out.push("<tbody>");
      if (tag === "td" && !out[out.length - 1]?.includes("<tr")) out.push("<tr>");
      out.push(`<tr>${cells.map((c) => `<${tag}>${inlineFormat(c)}</${tag}>`).join("")}</tr>`);
      if (tag === "th") out.push("</thead><tbody>");
      continue;
    } else if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
    }

    if (line.startsWith("- ")) {
      if (!listOpen) {
        out.push("<ul>");
        listOpen = true;
      }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }

    if (line.trim() === "---") {
      closeList();
      out.push('<hr class="section-break" />');
      continue;
    }

    if (line.trim() === "") {
      closeList();
      continue;
    }

    closeList();
    out.push(`<p>${inlineFormat(line)}</p>`);
  }

  closeList();
  if (inTable) out.push("</tbody></table>");
  if (inCode) out.push("</pre>");

  return out.join("\n");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function buildHtml(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Adigator — Complete Website Documentation</title>
  <style>
    @page { margin: 18mm 16mm 20mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a1a2e;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 22pt;
      color: #0f172a;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 8px;
      margin: 0 0 16px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      color: #1e40af;
      margin: 28px 0 10px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12pt;
      color: #334155;
      margin: 18px 0 8px;
      page-break-after: avoid;
    }
    h4 { font-size: 11pt; color: #475569; margin: 14px 0 6px; }
    p { margin: 0 0 8px; }
    ul { margin: 4px 0 12px 20px; padding: 0; }
    li { margin-bottom: 4px; }
    code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 9pt;
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 3px;
    }
    pre.code-block {
      font-family: Consolas, monospace;
      font-size: 8.5pt;
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px 14px;
      border-radius: 6px;
      overflow-x: auto;
      white-space: pre-wrap;
      margin: 10px 0 14px;
      page-break-inside: avoid;
    }
    table.doc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    table.doc-table th {
      background: #1e40af;
      color: #fff;
      text-align: left;
      padding: 7px 10px;
      font-weight: 600;
    }
    table.doc-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      vertical-align: top;
    }
    table.doc-table tr:nth-child(even) td { background: #f8fafc; }
    hr.section-break { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    a { color: #2563eb; text-decoration: none; }
    strong { color: #0f172a; }
    .cover {
      text-align: center;
      padding: 60px 20px 40px;
      page-break-after: always;
    }
    .cover h1 { border: none; font-size: 28pt; margin-bottom: 8px; }
    .cover .subtitle { font-size: 13pt; color: #64748b; margin-bottom: 32px; }
    .cover .meta { font-size: 10pt; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>Adigator</h1>
    <p class="subtitle">Complete Website Documentation</p>
    <p class="meta">Version 1.0 · June 2026 · adigator.in</p>
    <p class="meta">All pages · features · tools · workflows · APIs · database schema</p>
  </div>
  ${body}
</body>
</html>`;
}

async function main() {
  const md = readFileSync(mdPath, "utf8");
  const body = markdownToHtml(md);
  const html = buildHtml(body);
  writeFileSync(htmlPath, html, "utf8");
  console.log("HTML written:", htmlPath);

  const browserPath = findBrowser();
  if (!browserPath) {
    console.log("\nNo Edge/Chrome found. Open the HTML file in your browser and use Print → Save as PDF.");
    console.log(htmlPath);
    return;
  }

  const require = createRequire(import.meta.url);
  let puppeteer;
  try {
    puppeteer = require("puppeteer-core");
  } catch {
    console.log("\npuppeteer-core not installed. Run: npm install --no-save puppeteer-core");
    console.log("Or open the HTML file and Print → Save as PDF:", htmlPath);
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "14mm", bottom: "18mm", left: "14mm" },
    });
    console.log("PDF written:", pdfPath);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
