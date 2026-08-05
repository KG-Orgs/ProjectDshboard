import fs from "node:fs";

const filePath = "C:\\Users\\georg\\ProjectDshboard\\packages\\backend\\eval\\mlj017-smoke-v6-more-activedoc-output.txt";
const buf = fs.readFileSync(filePath);
const start = (buf[0] === 0xFF && buf[1] === 0xFE) ? 2 : 0;
const content = buf.slice(start).toString(start === 2 ? "utf16le" : "utf8");

const sqMatches = [...content.matchAll(/\[(sq\d+)\]/g)].map(m => m[1]);
console.log("All SQ IDs in order:", sqMatches.join(", "));

// Check for errors
const errorMatches = content.match(/Error|error|FAIL|crash|throw/gi)?.slice(0, 5);
console.log("\nError keywords:", errorMatches?.join(", ") ?? "none");

// Show char count near the end
console.log("\nFinal 500 chars (raw):");
console.log(JSON.stringify(content.slice(-500)));
process.exit(0);
