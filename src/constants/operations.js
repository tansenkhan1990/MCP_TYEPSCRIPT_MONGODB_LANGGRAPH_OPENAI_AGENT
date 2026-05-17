export const MONGO_OPERATIONS = ["read", "create", "update", "delete"];

/** All routable operations (MongoDB CRUD + web search). */
export const OPERATIONS = [...MONGO_OPERATIONS, "web"];

const DATA_LAYER_BY_OPERATION = {
  web: "duckduckgo",
};

export function normalizeOperation(operation) {
  return OPERATIONS.includes(operation) ? operation : "read";
}

export function isMongoOperation(operation) {
  return MONGO_OPERATIONS.includes(normalizeOperation(operation));
}

export function isWebOperation(operation) {
  return normalizeOperation(operation) === "web";
}

export function getDataLayer(operation) {
  return DATA_LAYER_BY_OPERATION[normalizeOperation(operation)] ?? "mcp";
}
