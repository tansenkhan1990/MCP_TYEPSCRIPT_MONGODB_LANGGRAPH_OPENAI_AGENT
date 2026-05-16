import { run } from "@openai/agents";
import { configureAgentsSdk } from "../config/agents.js";
import { AGENT_MAX_TURNS } from "../constants/agentRun.js";
import { normalizeOperation } from "../constants/operations.js";
import { toErrorMessage } from "../lib/errors.js";
import { createMcpServerForOperation } from "../mcp/mongodbServer.js";
import { createMongoAgent } from "./factory.js";

export async function runAgentWithMcp(userQuery, operation) {
  configureAgentsSdk();

  const op = normalizeOperation(operation);
  const mcpServer = createMcpServerForOperation(op);

  await mcpServer.connect();

  try {
    const agent = createMongoAgent(op, mcpServer);
    const runResult = await run(agent, userQuery, {
      maxTurns: AGENT_MAX_TURNS,
    });
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
