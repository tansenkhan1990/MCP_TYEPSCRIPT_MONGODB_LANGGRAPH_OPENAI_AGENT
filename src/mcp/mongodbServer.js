import path from "node:path";
import { fileURLToPath } from "node:url";
import { MCPServerStdio, createMCPToolStaticFilter } from "@openai/agents";
import { env } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER_ENTRY = path.resolve(
  __dirname,
  "../../node_modules/mongodb-mcp-server/dist/esm/index.js",
);

const READ_TOOLS = [
  "find",
  "aggregate",
  "count",
  "list-databases",
  "list-collections",
  "collection-schema",
  "collection-indexes",
  "explain",
];

const CREATE_TOOLS = ["insert-many", "create-collection", "create-index"];
const UPDATE_TOOLS = ["update-many", "rename-collection"];
const DELETE_TOOLS = ["delete-many", "drop-collection", "drop-index"];

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

export function createReadMcpServer() {
  return createFilteredServer("read", READ_TOOLS);
}

export function createCreateMcpServer() {
  return createFilteredServer("create", CREATE_TOOLS);
}

export function createUpdateMcpServer() {
  return createFilteredServer("update", UPDATE_TOOLS);
}

export function createDeleteMcpServer() {
  return createFilteredServer("delete", DELETE_TOOLS);
}
