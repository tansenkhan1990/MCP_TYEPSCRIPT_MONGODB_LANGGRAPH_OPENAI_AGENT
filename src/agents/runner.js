import "../config/tracing.js";
import { Runner } from "@openai/agents";

let runner;

export function getAgentRunner() {
  if (!runner) {
    runner = new Runner({ tracingDisabled: true });
  }
  return runner;
}
