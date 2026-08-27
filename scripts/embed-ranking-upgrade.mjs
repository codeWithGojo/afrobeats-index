import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.argv[2] || "Afri-Index-Complete.html");
const source = fs.readFileSync(new URL("./ranking-upgrade.js", import.meta.url), "utf8").trim();
let html = fs.readFileSync(target, "utf8");
const start = "<!-- AFRI_RANKING_UPGRADE_START -->";
const end = "<!-- AFRI_RANKING_UPGRADE_END -->";
const existing = new RegExp(`${start}[\\s\\S]*?${end}\\n?`, "g");
html = html.replace(existing, "");
const marker = "<script>\n(function () {\n  \"use strict\";\n\n  const escapeHtml";
if (!html.includes(marker)) throw new Error("Live-state enhancement marker not found");
const embedded = `${start}\n<script data-afri-ranking-upgrade>\n${source}\n</script>\n${end}\n`;
html = html.replace(marker, `${embedded}${marker}`);
fs.writeFileSync(target, html);
