import fs from "node:fs";

const path = "C:\\Users\\georg\\ProjectDshboard\\packages\\backend\\eval\\mlj017-smoke-v6-more-activedoc-output.txt";
const buf = fs.readFileSync(path);
const start = (buf[0] === 0xFF && buf[1] === 0xFE) ? 2 : 0;
const content = buf.slice(start).toString(start === 2 ? "utf16le" : "utf8");

const v5NoAnswer = new Set([
  "sq06","sq07","sq08","sq101","sq102","sq11","sq18","sq22","sq23","sq33",
  "sq36","sq37","sq38","sq39","sq40","sq41","sq49","sq54","sq55","sq56",
  "sq57","sq58","sq59","sq60","sq61","sq62","sq65","sq66","sq69","sq70",
  "sq71","sq72","sq73","sq80","sq83","sq85","sq86","sq92","sq93","sq97","sq99"
]);

const v6NoAnswer: string[] = [];
const v6Answered: string[] = [];

const blocks = content.split(/={10,}/);
for (let i = 1; i < blocks.length - 1; i += 2) {
  const headerBlock = blocks[i];
  const answerBlock = blocks[i + 1] ?? "";
  const idMatch = headerBlock.match(/\[(sq\d+)\]/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const hasNoAnswer = /I could not find/i.test(answerBlock);
  if (hasNoAnswer) v6NoAnswer.push(id); else v6Answered.push(id);
}

console.log(`\nV6 SCORE: ${v6Answered.length}/97 ANSWERED | ${v6NoAnswer.length} NO_ANSWER`);
console.log(`\nV6 NO_ANSWER IDs (${v6NoAnswer.length}):\n${v6NoAnswer.sort().join(", ")}`);

const gained = v6Answered.filter(id => v5NoAnswer.has(id));
const lost = v6NoAnswer.filter(id => !v5NoAnswer.has(id));
console.log(`\nGAINED vs v5 (${gained.length}): ${gained.sort().join(", ")}`);
console.log(`LOST vs v5 (${lost.length}): ${lost.sort().join(", ")}`);
process.exit(0);
