import { env } from "../config/env.js";
import { runWorkflow } from "./graph.js";

/**
 * Runs LangGraph workflow (DB init happens inside runWorkflow).
 */
export async function executeQuery(question) {
  const state = await runWorkflow(question);
  return {
    operation: state.operation,
    result: state.result,
    error: state.error,
    database: env.mongoDbName,
    collection: env.mongoCollection,
  };
}
