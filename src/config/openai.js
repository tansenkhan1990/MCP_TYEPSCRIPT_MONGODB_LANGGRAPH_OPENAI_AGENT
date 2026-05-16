import "../bootstrap.js";
import "./tracing.js";
import OpenAI from "openai";
import { setDefaultOpenAIClient, setOpenAIAPI } from "@openai/agents";
import { env } from "./env.js";

let configured = false;

export function configureOpenAI() {
  if (configured) return;

  const client = new OpenAI({
    apiKey: env.openaiApiKey,
    baseURL: env.openaiBaseUrl,
  });

  setDefaultOpenAIClient(client);
  setOpenAIAPI("chat_completions");
  configured = true;
}

export function getModelName() {
  return env.modelName;
}
