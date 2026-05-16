import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { classifyOperation } from "./router.js";
import { getAgentRunner } from "../agents/runner.js";
import { createReadAgent } from "../agents/readAgent.js";
import { createCreateAgent } from "../agents/createAgent.js";
import { createUpdateAgent } from "../agents/updateAgent.js";
import { createDeleteAgent } from "../agents/deleteAgent.js";
import { ensureDatabase } from "../db/init.js";

const WorkflowState = Annotation.Root({
  userQuery: Annotation(),
  operation: Annotation(),
  result: Annotation(),
  error: Annotation(),
});

async function routeNode(state) {
  const operation = classifyOperation(state.userQuery);
  return { operation };
}

function routeToAgent(state) {
  return state.operation;
}

async function runAgent(state, createAgent) {
  try {
    const agent = createAgent();
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
  }
}

async function readNode(state) {
  return runAgent(state, createReadAgent);
}

async function createNode(state) {
  return runAgent(state, createCreateAgent);
}

async function updateNode(state) {
  return runAgent(state, createUpdateAgent);
}

async function deleteNode(state) {
  return runAgent(state, createDeleteAgent);
}

export function buildWorkflowGraph() {
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

export async function runWorkflow(userQuery) {
  await ensureDatabase();

  const graph = buildWorkflowGraph();
  const finalState = await graph.invoke({
    userQuery,
    operation: null,
    result: null,
    error: null,
  });
  return finalState;
}
