import { runAnalyzerStatusMatrix } from "../app/lib/analyzerInsights.js";

const results = runAnalyzerStatusMatrix();
const failed = results.filter((row) => !row.pass);

for (const row of results) {
  const mark = row.pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${row.platform.padEnd(14)} ${row.size.padEnd(12)} → ${row.actual} (${row.label})`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} scenario(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} aligned-creative scenarios passed.`);
