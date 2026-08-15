import { config } from "dotenv";
config({ path: "../../.env" });
import { parseIdentifierQuery } from "../src/services/identifier-lookup.service.js";

const tests = [
  "In the MTACD-MLJTC2-L-0024 sub-contractor approval letter, what subcontractor is approved",
  "In Lockton Invoice 0849812, what are the remittance instructions",
  "In GEN-042R00, what was discussed",
  "In AVI-002R01 Ave I North Foundation Rebar Shop Drawings",
  "Summarize SWP-016",
  "Invoice 11707 pest control",
];
for (const t of tests) {
  const ids = parseIdentifierQuery(t);
  console.log(t.slice(0, 70).padEnd(70), "->", ids.map((i) => `${i.type}:${i.raw}`).join(", ") || "(none)");
}
process.exit(0);
