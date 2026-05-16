import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { classifyOperation, OPERATIONS } from "./router.js";
import { getAgentRunner } from "../agents/runner.js";
import { createReadAgent } from "../agents/readAgent.js";
import { createCreateAgent } from "../agents/createAgent.js";
import { createUpdateAgent } from "../agents/updateAgent.js";
import { createDeleteAgent } from "../agents/deleteAgent.js";
import {
  createReadMcpServer,
  createCreateMcpServer,
  createUpdateMcpServer,
  createDeleteMcpServer,
} from "../mcp/mongodbServer.js";
import { env } from "../config/env.js";

const WorkflowState = Annotation.Root({
  userQuery: Annotation(),
  operation: Annotation(),
  result: Annotation(),
  error: Annotation(),
});

const MCP_FACTORY_BY_OPERATION = {
  read: createReadMcpServer,
  create: createCreateMcpServer,
  update: createUpdateMcpServer,
  delete: createDeleteMcpServer,
};

const AGENT_FACTORY_BY_OPERATION = {
  read: createReadAgent,
  create: createCreateAgent,
  update: createUpdateAgent,
  delete: createDeleteAgent,
};

let compiledGraph;

function normalizeOperation(operation) {
  return OPERATIONS.includes(operation) ? operation : "read";
}

async function routeNode(state) {
  const operation = normalizeOperation(classifyOperation(state.userQuery));
  return { operation };
}

function routeToAgent(state) {
  return state.operation;
}

async function runAgentWithMcp(state, operation) {
  const createMcp = MCP_FACTORY_BY_OPERATION[operation];
  const createAgent = AGENT_FACTORY_BY_OPERATION[operation];
  const mcpServer = createMcp();

  await mcpServer.connect();

  try {
    const agent = createAgent(mcpServer);
    const runResult = await getAgentRunner().run(agent, state.userQuery);
    return {
      result: runResult.finalOutput ?? "No output returned from agent.",
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await mcpServer.close();
  }
}

async function readNode(state) {
  return runAgentWithMcp(state, "read");
}

async function createNode(state) {
  return runAgentWithMcp(state, "create");
}

async function updateNode(state) {
  return runAgentWithMcp(state, "update");
}

async function deleteNode(state) {
  return runAgentWithMcp(state, "delete");
}

function buildWorkflowGraph() {
  return new StateGraph(WorkflowState)
    .addNode("route", routeNode)
    .addNode("read_agent", readNode)
    .addNode("create_agent", createNode)
    .addNode("update_agent", updateNode)
    .addNode("delete_agent", deleteNode)
    .addEdge(START, "route")
    .addConditionalEdges("route", routeToAgent, {
      read: "read_agent",
      create: "create_agent",
      update: "update_agent",
      delete: "delete_agent",
    })
    .addEdge("read_agent", END)
    .addEdge("create_agent", END)
    .addEdge("update_agent", END)
    .addEdge("delete_agent", END)
    .compile();
}

export function getWorkflowGraph() {
  if (!compiledGraph) {
    compiledGraph = buildWorkflowGraph();
  }
  return compiledGraph;
}

export async function runWorkflow(userQuery) {
  const graph = getWorkflowGraph();
  const finalState = await graph.invoke({
    userQuery,
    operation: null,
    result: null,
    error: null,
  });
  return {
    ...finalState,
    database: env.mongoDbName,
    collection: env.mongoCollection,
    dataLayer: "mcp",
  };
}
