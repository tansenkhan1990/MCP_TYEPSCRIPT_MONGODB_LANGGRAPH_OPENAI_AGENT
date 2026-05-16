import { executeQuery } from "../workflow/executeQuery.js";

export async function handleQuery(query) {
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
