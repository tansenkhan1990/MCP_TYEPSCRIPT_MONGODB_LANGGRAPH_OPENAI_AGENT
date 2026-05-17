import { env } from "../config/env.js";
import { isMongoOperation } from "../constants/operations.js";

function mongoMeta(operation) {
  if (!isMongoOperation(operation)) {
    return {};
  }
  return {
    database: env.mongoDbName,
    collection: env.mongoCollection,
  };
}

export function formatQuerySuccess(outcome) {
  return {
    operation: outcome.operation,
    result: outcome.result,
    dataLayer: outcome.dataLayer,
    ...mongoMeta(outcome.operation),
  };
}

export function formatQueryError(outcome) {
  return {
    operation: outcome.operation,
    result: null,
    error: outcome.error,
    dataLayer: outcome.dataLayer,
    ...mongoMeta(outcome.operation),
  };
}
