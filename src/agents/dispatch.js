import { configureAgentsSdk } from "../config/agents.js";
import { isMongoOperation, isWebOperation, normalizeOperation } from "../constants/operations.js";
import { createMcpServerForOperation } from "../mcp/mongodbServer.js";
import { createAgentForOperation } from "./factory.js";
import { executeAgent } from "./runAgent.js";

export async function runForOperation(operation, userQuery) {
  configureAgentsSdk();

  const op = normalizeOperation(operation);

  if (isWebOperation(op)) {
    return await executeAgent(createAgentForOperation(op), userQuery);
  }

  if (!isMongoOperation(op)) {
    throw new Error(`Unsupported operation: ${op}`);
  }

  const mcpServer = createMcpServerForOperation(op);
  await mcpServer.connect();

  try {
    return await executeAgent(createAgentForOperation(op, mcpServer), userQuery);
  } finally {
    await mcpServer.close();
  }
}
