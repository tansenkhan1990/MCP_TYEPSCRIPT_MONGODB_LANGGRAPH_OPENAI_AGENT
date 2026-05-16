/**
 * CI-safe smoke checks (no Atlas / Ollama required).
 */
import { classifyOperation, OPERATIONS } from "../workflow/router.js";

const cases = [
  ["Find all movies", "read"],
  ["Insert a movie", "create"],
  ["Update the year", "update"],
  ["Delete old records", "delete"],
];

for (const [query, expected] of cases) {
  const actual = classifyOperation(query);
  if (actual !== expected) {
    console.error(`Router failed: "${query}" => ${actual}, expected ${expected}`);
    process.exit(1);
  }
}

if (OPERATIONS.length !== 4) {
  console.error("Expected 4 operations");
  process.exit(1);
}

console.log("verify: router OK");
