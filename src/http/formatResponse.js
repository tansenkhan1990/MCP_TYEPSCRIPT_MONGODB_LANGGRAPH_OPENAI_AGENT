import { getMongoScope } from "../constants/operations.js";

export function formatQuerySuccess(outcome) {
  return {
    operation: outcome.operation,
    result: outcome.result,
    dataLayer: outcome.dataLayer,
    ...getMongoScope(outcome.operation),
  };
}

export function formatQueryError(outcome) {
  return {
    operation: outcome.operation,
    result: null,
    error: outcome.error,
    dataLayer: outcome.dataLayer,
    ...getMongoScope(outcome.operation),
  };
}
