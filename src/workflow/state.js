import { Annotation } from "@langchain/langgraph";

export const WorkflowState = Annotation.Root({
  userQuery: Annotation(),
  operation: Annotation(),
  result: Annotation(),
  error: Annotation(),
});
