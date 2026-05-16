import "../bootstrap.js";
import { setTracingDisabled, setTraceProcessors } from "@openai/agents";

let tracingConfigured = false;

/** Stops OpenAI trace export and span collection (safe for Ollama / local models). */
export function disableTracing() {
  if (tracingConfigured) return;
  setTraceProcessors([]);
  setTracingDisabled(true);
  tracingConfigured = true;
}

disableTracing();
