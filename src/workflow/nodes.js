import { runAgentWithMcp } from "../agents/runWithMcp.js";
import { normalizeOperation } from "../constants/operations.js";
import { classifyOperation } from "./router.js";

export async function routeNode(state) {
  const operation = normalizeOperation(classifyOperation(state.userQuery));
  return { operation };
}

export function routeToAgent(state) {
  return state.operation;
}

/**
 * Single executor node: uses routed `state.operation` (LangGraph best practice —
 * route once, execute once; MCP/agent selection follows state).
 */
export async function executeAgentNode(state) {
  return runAgentWithMcp(state.userQuery, state.operation);
}
