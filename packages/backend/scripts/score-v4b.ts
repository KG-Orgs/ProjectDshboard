/**
 * Parse v4 smoke test output to get per-question pass/fail.
 * Correctly handles UTF-16 LE and the two-block-per-question structure.
 */
import fs from "node:fs";

const path = "C:\\Users\\georg\\ProjectDshboard\\packages\\backend\\eval\\mlj017-smoke-v4-post-all-fixes-output.txt";
// UTF-16 LE with BOM
const buf = fs.readFileSync(path);
const start = (buf[0] === 0xFF && buf[1] === 0xFE) ? 2 : 0;
const content = buf.slice(start).toString("utf16le");

const v3NoAnswer = new Set([
  "sq06","sq11","sq18","sq22","sq28","sq29","sq30","sq31","sq33","sq36","sq37",
  "sq38","sq39","sq40","sq41","sq49","sq56","sq57","sq60","sq61","sq62","sq65",
  "sq66","sq69","sq70","sq71","sq72","sq73","sq75","sq80","sq85","sq86","sq91",
  "sq99","sq101","sq102"
]);

const v4NoAnswer: string[] = [];
const v4Answered: string[] = [];

// Structure: === splits into pairs: [question_header, answer_content]
const blocks = content.split(/={10,}/);
// blocks[0] = preamble; then pairs: odd=question header, even=answer
for (let i = 1; i < blocks.length - 1; i += 2) {
  const headerBlock = blocks[i];
  const answerBlock = blocks[i + 1] ?? "";

  const idMatch = headerBlock.match(/\[(sq\d+)\]/);
  if (!idMatch) continue;
  const id = idMatch[1];

  const hasNoAnswer = /I could not find/i.test(answerBlock);
  if (hasNoAnswer) {
    v4NoAnswer.push(id);
  } else {
    v4Answered.push(id);
  }
}

console.log(`\nV4 SCORE: ${v4Answered.length}/97 ANSWERED | ${v4NoAnswer.length} NO_ANSWER`);
console.log(`\nV4 NO_ANSWER IDs (${v4NoAnswer.length}):`);
console.log(v4NoAnswer.sort().join(", "));

const gained = v4Answered.filter(id => v3NoAnswer.has(id));
const lost = v4NoAnswer.filter(id => !v3NoAnswer.has(id));

console.log(`\nGAINED vs v3 (${gained.length}): ${gained.sort().join(", ")}`);
console.log(`LOST vs v3 (${lost.length}): ${lost.sort().join(", ")}`);
process.exit(0);
