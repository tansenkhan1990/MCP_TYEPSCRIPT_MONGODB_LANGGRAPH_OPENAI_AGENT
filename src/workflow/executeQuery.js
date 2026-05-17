import { runWorkflow } from "./graph.js";

/**
 * Single entry: LangGraph route → agent dispatch (MongoDB MCP or DuckDuckGo web).
 */
export async function executeQuery(question) {
  const state = await runWorkflow(question);
  const outcome = {
    operation: state.operation,
    result: state.result,
    error: state.error,
    dataLayer: state.dataLayer,
  };
  if (state.database != null) outcome.database = state.database;
  if (state.collection != null) outcome.collection = state.collection;
  return outcome;
}
