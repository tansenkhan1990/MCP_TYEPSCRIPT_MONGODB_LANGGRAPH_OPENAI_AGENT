import { StateGraph, START, END } from "@langchain/langgraph";
import { OPERATIONS, agentNodeId } from "../constants/operations.js";
import { env } from "../config/env.js";
import { WorkflowState } from "./state.js";
import { routeNode, routeToAgent, agentNodesByOperation } from "./nodes.js";

let compiledGraph;

function buildWorkflowGraph() {
  const builder = new StateGraph(WorkflowState)
    .addNode("route", routeNode)
    .addEdge(START, "route");

  const conditionalTargets = {};

  for (const operation of OPERATIONS) {
    const nodeId = agentNodeId(operation);
    builder.addNode(nodeId, agentNodesByOperation[operation]);
    builder.addEdge(nodeId, END);
    conditionalTargets[operation] = nodeId;
  }

  builder.addConditionalEdges("route", routeToAgent, conditionalTargets);

  return builder.compile();
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
