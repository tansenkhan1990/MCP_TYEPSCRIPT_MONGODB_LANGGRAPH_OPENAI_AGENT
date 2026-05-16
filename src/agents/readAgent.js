import { Agent } from "@openai/agents";
import { getModelName } from "../config/openai.js";
import { sharedMongoRules } from "./baseInstructions.js";

export function createReadAgent(mcpServer) {
  return new Agent({
    name: "MongoDB Read Agent (MCP)",
    instructions: [
      sharedMongoRules(),
      "Your only job is READ operations via MCP: find, aggregate, count, list-databases, list-collections, collection-schema.",
      "Do not insert, update, or delete documents.",
      "Return concise summaries plus key fields from tool results.",
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
