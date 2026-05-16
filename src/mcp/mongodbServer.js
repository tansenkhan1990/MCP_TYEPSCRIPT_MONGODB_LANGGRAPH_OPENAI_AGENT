import path from "node:path";
import { fileURLToPath } from "node:url";
import { MCPServerStdio, createMCPToolStaticFilter } from "@openai/agents";
import { normalizeOperation } from "../constants/operations.js";
import { env } from "../config/env.js";
import { MCP_TOOL_SETS } from "./toolSets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER_ENTRY = path.resolve(
  __dirname,
  "../../node_modules/mongodb-mcp-server/dist/esm/index.js",
);

const MCP_TIMEOUT_MS = 120_000;

function createFilteredServer(name, allowedTools) {
  return new MCPServerStdio({
    name: `MongoDB MCP (${name})`,
    command: process.execPath,
    args: [MCP_SERVER_ENTRY],
    env: {
      MDB_MCP_CONNECTION_STRING: env.mongoConnectionString,
    },
    cacheToolsList: true,
    clientSessionTimeoutSeconds: 120,
    timeout: MCP_TIMEOUT_MS,
    toolFilter: createMCPToolStaticFilter({ allowed: allowedTools }),
  });
}

export function createMcpServerForOperation(operation) {
  const op = normalizeOperation(operation);
  return createFilteredServer(op, MCP_TOOL_SETS[op]);
}
