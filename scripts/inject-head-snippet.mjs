/**
 * Post-build script: injects the HEAD_SNIPPET env variable content
 * before </head> in every HTML file under the `out/` directory.
 *
 * Usage: node scripts/inject-head-snippet.mjs
 * The HEAD_SNIPPET env var is expected to be set by the CI pipeline
 * (loaded from a GitHub secret).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const snippet = process.env.HEAD_SNIPPET;

if (!snippet) {
  console.log("HEAD_SNIPPET not set – skipping head injection.");
  process.exit(0);
}

function findHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

const outDir = join(process.cwd(), "out");
const htmlFiles = findHtmlFiles(outDir);
let count = 0;

for (const file of htmlFiles) {
  const content = readFileSync(file, "utf-8");
  if (content.includes("</head>")) {
    writeFileSync(file, content.replace("</head>", `${snippet}</head>`));
    count++;
  }
}

console.log(`HEAD_SNIPPET injected into ${count} HTML file(s).`);
