import { OPERATIONS, normalizeOperation } from "../constants/operations.js";
import { runAgentWithMcp } from "../agents/runWithMcp.js";
import { classifyOperation } from "./router.js";

export async function routeNode(state) {
  const operation = normalizeOperation(classifyOperation(state.userQuery));
  return { operation };
}

export function routeToAgent(state) {
  return state.operation;
}

export function createAgentNode(operation) {
  return async function agentNode(state) {
    return runAgentWithMcp(state.userQuery, operation);
  };
}

export const agentNodesByOperation = Object.fromEntries(
  OPERATIONS.map((op) => [op, createAgentNode(op)]),
);
