import fs from "node:fs";

const filePath = "C:\\Users\\georg\\ProjectDshboard\\packages\\backend\\eval\\mlj017-smoke-v6-more-activedoc-output.txt";
const buf = fs.readFileSync(filePath);
const start = (buf[0] === 0xFF && buf[1] === 0xFE) ? 2 : 0;
const content = buf.slice(start).toString(start === 2 ? "utf16le" : "utf8");

// Show last 2000 chars
console.log("Last 2000 chars:");
console.log(content.slice(-2000));
process.exit(0);
