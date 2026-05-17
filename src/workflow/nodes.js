import { runForOperation } from "../agents/dispatch.js";
import { normalizeOperation } from "../constants/operations.js";
import { classifyOperation } from "./router.js";

export async function routeNode(state) {
  const operation = normalizeOperation(classifyOperation(state.userQuery));
  return { operation };
}

export function routeToAgent(state) {
  return state.operation;
}

export async function executeAgentNode(state) {
  return runForOperation(state.operation, state.userQuery);
}
