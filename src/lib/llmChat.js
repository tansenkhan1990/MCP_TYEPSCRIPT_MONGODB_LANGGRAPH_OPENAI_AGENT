import OpenAI from "openai";
import { configureAgentsSdk, getModelName } from "../config/agents.js";
import { env } from "../config/env.js";

export async function chatWithMessages(messages, { temperature = 0.2 } = {}) {
  configureAgentsSdk();

  const client = new OpenAI({
    apiKey: env.openaiApiKey,
    baseURL: env.openaiBaseUrl,
  });

  const response = await client.chat.completions.create({
    model: getModelName(),
    temperature,
    messages,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
