import { normalizeOperation } from "../constants/operations.js";
import { toErrorMessage } from "../lib/errors.js";
import { createMcpServerForOperation } from "../mcp/mongodbServer.js";
import { createMongoAgent } from "./factory.js";
import { getAgentRunner } from "./runner.js";

export async function runAgentWithMcp(userQuery, operation) {
  const op = normalizeOperation(operation);
  const mcpServer = createMcpServerForOperation(op);

  await mcpServer.connect();

  try {
    const agent = createMongoAgent(op, mcpServer);
    const runResult = await getAgentRunner().run(agent, userQuery);
    return {
      result: runResult.finalOutput ?? "No output returned from agent.",
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: toErrorMessage(err),
    };
  } finally {
    await mcpServer.close();
  }
}
