import { runWorkflow } from "./graph.js";

/**
 * LangGraph orchestration → OpenAI Agent (MCP tools) → MongoDB Atlas.
 */
export async function executeQuery(question) {
  const state = await runWorkflow(question);
  return {
    operation: state.operation,
    result: state.result,
    error: state.error,
    database: state.database,
    collection: state.collection,
    dataLayer: state.dataLayer,
  };
}
