import { Agent } from "@openai/agents";
import { getModelName } from "../config/openai.js";
import { sharedMongoRules } from "./baseInstructions.js";

export function createDeleteAgent(mcpServer) {
  return new Agent({
    name: "MongoDB Delete Agent (MCP)",
    instructions: [
      sharedMongoRules(),
      "Your only job is DELETE operations via MCP: delete-many.",
      "Never drop an entire database unless the user explicitly requests it.",
      "Use a narrow filter for delete-many; report deleted count from tool results.",
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
