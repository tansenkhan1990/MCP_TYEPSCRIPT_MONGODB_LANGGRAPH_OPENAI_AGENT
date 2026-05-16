import { Agent } from "@openai/agents";
import { getModelName } from "../config/openai.js";
import { sharedMongoRules } from "./baseInstructions.js";

export function createCreateAgent(mcpServer) {
  return new Agent({
    name: "MongoDB Create Agent (MCP)",
    instructions: [
      sharedMongoRules(),
      "Your only job is CREATE operations via MCP: insert-many (and create-collection only when explicitly requested).",
      "Use insert-many for one or many documents. Validate document shape before insert.",
      "Summarize inserted count and example _id values from tool output.",
    ].join("\n"),
    model: getModelName(),
    mcpServers: [mcpServer],
    mcpConfig: { includeServerInToolNames: true },
    modelSettings: {
      toolChoice: "required",
      temperature: 0.2,
    },
  });
}
