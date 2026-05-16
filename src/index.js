import "./bootstrap.js";
import "./config/tracing.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { configureOpenAI } from "./config/openai.js";
import { env } from "./config/env.js";
import { executeQuery } from "./workflow/executeQuery.js";

function printBanner() {
  console.log("\nMongoDB Atlas Agent (LangGraph + OpenAI Agents + MCP)");
  console.log(`Model: ${env.modelName}`);
  console.log(`MCP target: ${env.mongoDbName}.${env.mongoCollection}`);
  console.log(`Optional seed: npm run db:init`);
  console.log("\nOperations: read | create | update | delete");
  console.log('Type a natural-language request, or "exit" to quit.\n');
}

async function handleQuery(query) {
  console.log("\nRouting request through LangGraph workflow...\n");
  const outcome = await executeQuery(query);

  console.log(`Operation: ${outcome.operation}`);
  if (outcome.error) {
    console.error(`Error: ${outcome.error}`);
    return;
  }
  console.log("\n--- Agent response ---\n");
  console.log(outcome.result);
  console.log("\n----------------------\n");
}

async function runInteractive() {
  const rl = readline.createInterface({ input, output });
  printBanner();

  while (true) {
    const query = (await rl.question("You> ")).trim();
    if (!query) continue;
    if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") break;

    try {
      await handleQuery(query);
    } catch (err) {
      console.error("Workflow failed:", err instanceof Error ? err.message : err);
    }
  }

  rl.close();
  console.log("Goodbye.");
}

async function main() {
  configureOpenAI();

  const cliQuery = process.argv.slice(2).join(" ").trim();
  if (cliQuery) {
    await handleQuery(cliQuery);
    return;
  }

  await runInteractive();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
