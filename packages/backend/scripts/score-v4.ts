/**
 * Parse v4 smoke test output to get per-question pass/fail.
 */
import fs from "node:fs";

const path = "C:\\Users\\georg\\ProjectDshboard\\packages\\backend\\eval\\mlj017-smoke-v4-post-all-fixes-output.txt";
// UTF-16 LE with BOM — read as buffer and decode
const buf = fs.readFileSync(path);
// Strip BOM (0xFF 0xFE) if present
const start = (buf[0] === 0xFF && buf[1] === 0xFE) ? 2 : 0;
const content = buf.slice(start).toString("utf16le");
console.log("Content length:", content.length);
console.log("First 200 chars:", JSON.stringify(content.slice(0, 200)));
console.log("Has [sq01]:", content.includes("[sq01]"));
console.log("Has 'I could not find':", content.includes("I could not find"));

// Split into question blocks by the === header
const blocks = content.split(/={10,}/);
console.log("Blocks count:", blocks.length);
console.log("Block 1 has [sq01]:", blocks[1]?.includes("[sq01]"));
console.log("Block 1 first 100:", JSON.stringify(blocks[1]?.slice(0, 100)));
console.log("Block 2 has 'I could not find':", blocks[2]?.includes("I could not find"));

const v3NoAnswer = new Set([
  "sq06","sq11","sq18","sq22","sq28","sq29","sq30","sq31","sq33","sq36","sq37",
  "sq38","sq39","sq40","sq41","sq49","sq56","sq57","sq60","sq61","sq62","sq65",
  "sq66","sq69","sq70","sq71","sq72","sq73","sq75","sq80","sq85","sq86","sq91",
  "sq99","sq101","sq102"
]);

const v4NoAnswer: string[] = [];
const v4Answered: string[] = [];

for (const block of blocks) {
  // Find the sq ID
  const idMatch = block.match(/\[(sq\d+)\]/);
  if (!idMatch) continue;
  const id = idMatch[1];
  
  // Check if it has "I could not find"
  const hasNoAnswer = /I could not find/i.test(block);
  if (hasNoAnswer) {
    v4NoAnswer.push(id);
  } else if (block.includes("--- ANSWER ---")) {
    v4Answered.push(id);
  }
}

console.log(`\nV4 SCORE: ${v4Answered.length}/97 ANSWERED, ${v4NoAnswer.length} NO_ANSWER`);
console.log(`\nV4 NO_ANSWER IDs (${v4NoAnswer.length}):`);
console.log(v4NoAnswer.sort().join(", "));

const gained = v4Answered.filter(id => v3NoAnswer.has(id));
const lost = v4NoAnswer.filter(id => !v3NoAnswer.has(id));

console.log(`\nGAINED vs v3 (${gained.length}): ${gained.join(", ")}`);
console.log(`LOST vs v3 (${lost.length}): ${lost.join(", ")}`);
process.exit(0);
