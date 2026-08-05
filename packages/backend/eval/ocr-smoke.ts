/**
 * Quick smoke test: OCR a single scanned PDF and print the extracted text.
 * Usage: pnpm tsx eval/ocr-smoke.ts
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { ocrPdfPages } from "../src/services/pdf-ocr.service.js";

const testFile =
  process.argv[2] ??
  "C:\\Users\\georg\\Iovino Enterprises, LLC\\MLJ-017 Package 6 - General\\07 - INVOICES\\2025 Lockton Invoice 0849812.pdf";

async function main() {
  console.log(`OCR smoke test on: ${testFile}\n`);
  const start = Date.now();
  const result = await ocrPdfPages(testFile);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`Pages OCR'd: ${result.pageTexts.length}`);
  console.log(`Total chars: ${result.text.length}`);
  console.log(`Elapsed:     ${elapsed}s`);
  console.log("\n--- TEXT PREVIEW (first 800 chars) ---");
  console.log(result.text.slice(0, 800));
}
main().catch(e => { console.error(e); process.exit(1); });
