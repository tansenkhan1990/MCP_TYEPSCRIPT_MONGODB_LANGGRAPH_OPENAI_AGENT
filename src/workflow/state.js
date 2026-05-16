import { Annotation } from "@langchain/langgraph";

/**
 * LangGraph state: each key is last-write-wins per node update (default reducer).
 * Flow: route sets operation → execute_agent sets result | error.
 */
export const WorkflowState = Annotation.Root({
  userQuery: Annotation(),
  operation: Annotation(),
  result: Annotation(),
  error: Annotation(),
});
