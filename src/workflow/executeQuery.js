import { configureAgentsSdk } from "../config/agents.js";
import { runWorkflow } from "./graph.js";
import { toQueryOutcome } from "./outcome.js";

/** Single entry for CLI and API: LangGraph route → agent dispatch (MongoDB MCP or web). */
export async function executeQuery(question) {
  configureAgentsSdk();
  const state = await runWorkflow(question);
  return toQueryOutcome(state);
}
