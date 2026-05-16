import { Agent } from "@openai/agents";
import { getModelName } from "../config/agents.js";
import { normalizeOperation } from "../constants/operations.js";
import { AGENT_DEFINITIONS } from "./definitions.js";
import { sharedMongoRules } from "./baseInstructions.js";

export function createMongoAgent(operation, mcpServer) {
  const op = normalizeOperation(operation);
  const definition = AGENT_DEFINITIONS[op];

  return new Agent({
    name: definition.name,
    instructions: [sharedMongoRules(), definition.roleInstructions].join("\n"),
    model: getModelName(),
    mcpServers: [mcpServer],
    mcpConfig: { includeServerInToolNames: true },
    modelSettings: {
      toolChoice: "required",
      temperature: 0.2,
    },
  });
}
