import { isMongoOperation, normalizeOperation } from "../constants/operations.js";
import { queryInventory } from "../data/inventory.js";
import { queryRag } from "../rag/queryRag.js";
import { createMcpServerForOperation } from "../mcp/mongodbServer.js";
import { createAgentForOperation } from "./factory.js";
import { executeAgent } from "./runAgent.js";

const DIRECT_HANDLERS = {
  inventory: queryInventory,
  rag: queryRag,
  web: (userQuery) => executeAgent(createAgentForOperation("web"), userQuery),
};

export async function runForOperation(operation, userQuery) {
  const op = normalizeOperation(operation);
  const direct = DIRECT_HANDLERS[op];

  if (direct) {
    return direct(userQuery);
  }

  if (!isMongoOperation(op)) {
    throw new Error(`Unsupported operation: ${op}`);
  }

  const mcpServer = createMcpServerForOperation(op);
  await mcpServer.connect();

  try {
    return executeAgent(createAgentForOperation(op, mcpServer), userQuery);
  } finally {
    await mcpServer.close();
  }
}
