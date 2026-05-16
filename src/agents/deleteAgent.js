import { Agent } from "@openai/agents";
import { getModelName } from "../config/openai.js";
import { sharedMongoRules } from "./baseInstructions.js";
import { deleteTools } from "./tools/movieTools.js";

export function createDeleteAgent() {
  return new Agent({
    name: "MongoDB Delete Agent",
    instructions: [
      sharedMongoRules(),
      "Your only job is DELETE operations using delete_movies.",
      "Use a narrow filter; never delete all documents unless the user explicitly requests it.",
      "Report deletedCount from the tool result.",
    ].join("\n"),
    model: getModelName(),
    tools: deleteTools,
    modelSettings: {
      toolChoice: "required",
      temperature: 0.2,
    },
  });
}
