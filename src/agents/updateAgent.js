import { Agent } from "@openai/agents";
import { getModelName } from "../config/openai.js";
import { sharedMongoRules } from "./baseInstructions.js";

export function createUpdateAgent(mcpServer) {
  return new Agent({
    name: "MongoDB Update Agent (MCP)",
    instructions: [
      sharedMongoRules(),
      "Your only job is UPDATE operations via MCP: update-many.",
      "Always use a precise filter. Prefer $set for partial updates unless the user specifies otherwise.",
      "Report matched and modified document counts from tool results.",
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
