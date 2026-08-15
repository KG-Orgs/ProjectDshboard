import { config } from "dotenv";
config({ path: "../../.env" });
import { isDocumentSummaryQuery } from "../src/services/interpretation.service.js";

const cases: [string, boolean][] = [
  ["What is in the Myrtle Ave Reserve Service Load Letter?",  true],
  ["What was discussed in the September 3, 2025 coordination meeting?", true],
  ["Summarize SWP-016", true],
  ["summary of the project", true],
  ["overview of the project", true],
  ["What is the status of RFI-042?", false],
  ["What was discussed?", false],                  // no "meeting" → false
  ["What was discussed at the board meeting?", true],  // has "meeting" → true
];

let pass = 0; let fail = 0;
for (const [q, expected] of cases) {
  const got = isDocumentSummaryQuery(q);
  const ok = got === expected;
  console.log((ok ? "PASS" : "FAIL"), `expected=${expected} got=${got}`, q.slice(0,70));
  if (ok) pass++; else fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
