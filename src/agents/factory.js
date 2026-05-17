import { Agent } from "@openai/agents";
import { getModelName } from "../config/agents.js";
import { isMongoOperation, isWebOperation, normalizeOperation } from "../constants/operations.js";
import { AGENT_DEFINITIONS } from "./definitions.js";
import { sharedMongoRules } from "./baseInstructions.js";

export function createAgentForOperation(operation, mcpServer = null) {
  const op = normalizeOperation(operation);
  const definition = AGENT_DEFINITIONS[op];

  if (!definition) {
    throw new Error(`Unknown operation: ${op}`);
  }

  if (isWebOperation(op)) {
    return new Agent({
      name: definition.name,
      instructions: definition.roleInstructions,
      model: getModelName(),
      tools: definition.tools,
      modelSettings: definition.modelSettings,
    });
  }

  if (!isMongoOperation(op) || !mcpServer) {
    throw new Error(`MongoDB agent requires MCP server for operation: ${op}`);
  }

  const instructions = definition.useMongoRules
    ? [sharedMongoRules(), definition.roleInstructions].join("\n")
    : definition.roleInstructions;

  return new Agent({
    name: definition.name,
    instructions,
    model: getModelName(),
    mcpServers: [mcpServer],
    mcpConfig: { includeServerInToolNames: true },
    modelSettings: definition.modelSettings,
  });
}
