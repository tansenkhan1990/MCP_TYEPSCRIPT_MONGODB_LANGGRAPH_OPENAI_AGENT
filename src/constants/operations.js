import { env } from "../config/env.js";
import { VECTORLESS_RAG_COLLECTION } from "./rag.js";

export const MONGO_OPERATIONS = ["read", "create", "update", "delete"];

/** All routable operations (MongoDB CRUD + RAG + inventory + web search). */
export const OPERATIONS = [...MONGO_OPERATIONS, "rag", "inventory", "web"];

const DATA_LAYER_BY_OPERATION = {
  web: "duckduckgo",
  rag: "vectorless_rag",
  inventory: "internal_catalog",
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

export function isRagOperation(operation) {
  return normalizeOperation(operation) === "rag";
}

export function isInventoryOperation(operation) {
  return normalizeOperation(operation) === "inventory";
}

export function getDataLayer(operation) {
  return DATA_LAYER_BY_OPERATION[normalizeOperation(operation)] ?? "mcp";
}

/** Mongo target metadata for API/CLI responses. */
export function getMongoScope(operation) {
  const op = normalizeOperation(operation);

  if (isRagOperation(op)) {
    return {
      database: env.mongoDbName,
      collection: VECTORLESS_RAG_COLLECTION,
    };
  }

  if (!isMongoOperation(op)) {
    return {};
  }

  return {
    database: env.mongoDbName,
    collection: env.mongoCollection,
  };
}
