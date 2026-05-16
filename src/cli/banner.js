import { env } from "../config/env.js";

export function printBanner() {
  console.log("\nMongoDB Atlas Agent (LangGraph + OpenAI Agents + MCP)");
  console.log(`Model: ${env.modelName}`);
  console.log(`MCP target: ${env.mongoDbName}.${env.mongoCollection}`);
  console.log(`Optional seed: npm run db:init`);
  console.log("\nOperations: read | create | update | delete");
  console.log('Type a natural-language request, or "exit" to quit.\n');
}
