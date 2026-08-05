/**
 * Diagnose why walkCorpus sees 0 files in the RFI'S folder.
 */
import { config } from "dotenv";
config({ path: "../../.env" });
import fs from "node:fs";
import path from "node:path";

const rfiPath = "C:\\Users\\georg\\Iovino Enterprises, LLC\\MLJ-017 Package 6 - General\\24 - RFI'S";

console.log("Testing RFI path:", rfiPath);
console.log("Exists:", fs.existsSync(rfiPath));

let topEntries: fs.Dirent[];
try {
  topEntries = fs.readdirSync(rfiPath, { withFileTypes: true });
  console.log(`Top-level entries: ${topEntries.length}`);
  for (const e of topEntries) {
    console.log(`  [${e.isDirectory() ? "DIR" : e.isFile() ? "FILE" : "OTHER"}] ${e.name}`);
  }
} catch (err) {
  console.error("readdirSync failed:", err);
  process.exit(1);
}

// Go one level deeper
let totalFiles = 0;
let pdfDocxFiles = 0;
const stack: string[] = [rfiPath];
while (stack.length > 0) {
  const dir = stack.pop()!;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.log(`  SKIP DIR (error): ${dir}`);
    continue;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stack.push(full);
      continue;
    }
    if (!entry.isFile()) {
      console.log(`  NON-FILE entry: ${full} [symlink=${entry.isSymbolicLink()}]`);
      continue;
    }
    totalFiles++;
    const ext = entry.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "";
    if (ext === "pdf" || ext === "docx") {
      pdfDocxFiles++;
      // Check stat
      try {
        const stat = fs.lstatSync(full);
        if (pdfDocxFiles <= 10) {
          console.log(`  [${ext.toUpperCase()}] size=${stat.size} blk=${stat.blocks} ${entry.name.slice(0, 60)}`);
        }
      } catch {
        if (pdfDocxFiles <= 10) console.log(`  [${ext.toUpperCase()}] stat FAILED: ${entry.name.slice(0, 60)}`);
      }
    }
  }
}

console.log(`\nTotal files found: ${totalFiles}`);
console.log(`PDF/DOCX files found: ${pdfDocxFiles}`);
process.exit(0);
