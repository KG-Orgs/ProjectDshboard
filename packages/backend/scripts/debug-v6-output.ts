import fs from "node:fs";

const filePath = "C:\\Users\\georg\\ProjectDshboard\\packages\\backend\\eval\\mlj017-smoke-v6-more-activedoc-output.txt";
const buf = fs.readFileSync(filePath);
const start = (buf[0] === 0xFF && buf[1] === 0xFE) ? 2 : 0;
const content = buf.slice(start).toString(start === 2 ? "utf16le" : "utf8");

console.log("Content length:", content.length);
console.log("First 500 chars:");
console.log(JSON.stringify(content.slice(0, 500)));

// Check separator
const sep = "========================================================================";
const eqTest = /={10,}/.test(content);
console.log("\nRegex /={10,}/ matches:", eqTest);
console.log("String.includes sep:", content.includes(sep));

const blocks = content.split(/={10,}/);
console.log("Blocks count:", blocks.length);

const sqMatches = content.match(/\[(sq\d+)\]/g);
console.log("SQ IDs found:", sqMatches?.length);
process.exit(0);
