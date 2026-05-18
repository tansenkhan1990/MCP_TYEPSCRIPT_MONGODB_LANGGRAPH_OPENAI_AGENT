import { StateGraph, START, END } from "@langchain/langgraph";
import { OPERATIONS } from "../constants/operations.js";
import { WorkflowState } from "./state.js";
import { routeNode, routeToAgent, executeAgentNode } from "./nodes.js";

const EXECUTE_AGENT_NODE = "execute_agent";

let compiledGraph;

function buildWorkflowGraph() {
  const routeTargets = Object.fromEntries(
    OPERATIONS.map((op) => [op, EXECUTE_AGENT_NODE]),
  );

  return new StateGraph(WorkflowState)
    .addNode("route", routeNode)
    .addNode(EXECUTE_AGENT_NODE, executeAgentNode)
    .addEdge(START, "route")
    .addConditionalEdges("route", routeToAgent, routeTargets)
    .addEdge(EXECUTE_AGENT_NODE, END)
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
  return graph.invoke({
    userQuery,
    operation: null,
    result: null,
    error: null,
  });
}
