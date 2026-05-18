import { getDataLayer, getMongoScope } from "../constants/operations.js";

export function toQueryOutcome(state) {
  return {
    operation: state.operation,
    result: state.result,
    error: state.error,
    dataLayer: getDataLayer(state.operation),
    ...getMongoScope(state.operation),
  };
}
