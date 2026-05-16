export const OPERATIONS = ["read", "create", "update", "delete"];

export function normalizeOperation(operation) {
  return OPERATIONS.includes(operation) ? operation : "read";
}

export function agentNodeId(operation) {
  return `${operation}_agent`;
}
