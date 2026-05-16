import "../bootstrap.js";
import "./tracing.js";
/**
 * OpenAI Agents SDK setup (NOT a bypass of the SDK).
 *
 * - Agent, run, MCP → imported from "@openai/agents" in src/agents/*
 * - setDefaultOpenAIClient / setOpenAIAPI → also from "@openai/agents"
 *
 * The `openai` npm package here is only the HTTP client the SDK uses to call
 * the model (OpenAI API or Ollama). @openai/agents depends on `openai` internally.
 */
import OpenAI from "openai";
import { setDefaultOpenAIClient, setOpenAIAPI } from "@openai/agents";
import { env } from "./env.js";

let configured = false;

/** Wires the Agents SDK to your LLM endpoint (see .env OPENAI_BASE_URL). */
export function configureAgentsSdk() {
  if (configured) return;

  const llmClient = new OpenAI({
    apiKey: env.openaiApiKey,
    baseURL: env.openaiBaseUrl,
  });

  setDefaultOpenAIClient(llmClient);
  setOpenAIAPI("chat_completions");
  configured = true;
}

export function getModelName() {
  return env.modelName;
}
