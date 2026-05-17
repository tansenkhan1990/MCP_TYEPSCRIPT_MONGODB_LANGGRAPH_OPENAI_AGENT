/**
 * CI-safe smoke checks (no Atlas / Ollama / DuckDuckGo required).
 */
import { formatQuerySuccess } from "../http/formatResponse.js";
import { classifyOperation, OPERATIONS } from "../workflow/router.js";

const cases = [
  ["Find all movies in sample_mflix.movies", "read"],
  ["Insert a movie", "create"],
  ["Update the year", "update"],
  ["Delete old records", "delete"],
  ["Search the web for latest Node.js LTS news", "web"],
  ["Who is the CEO of OpenAI? Use duckduckgo", "web"],
  ["Find movies online in sample_mflix.movies", "read"],
];

for (const [query, expected] of cases) {
  const actual = classifyOperation(query);
  if (actual !== expected) {
    console.error(`Router failed: "${query}" => ${actual}, expected ${expected}`);
    process.exit(1);
  }
}

if (OPERATIONS.length !== 5) {
  console.error("Expected 5 operations (read, create, update, delete, web)");
  process.exit(1);
}

const webPayload = formatQuerySuccess({
  operation: "web",
  result: "ok",
  dataLayer: "duckduckgo",
});
if ("database" in webPayload || "collection" in webPayload) {
  console.error("Web response must not include database/collection");
  process.exit(1);
}

const readPayload = formatQuerySuccess({
  operation: "read",
  result: "ok",
  dataLayer: "mcp",
});
if (!readPayload.database || !readPayload.collection) {
  console.error("Mongo response must include database/collection");
  process.exit(1);
}

console.log("verify: router OK");
console.log("verify: response shape OK");
