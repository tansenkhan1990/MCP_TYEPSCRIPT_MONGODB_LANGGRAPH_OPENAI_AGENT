import { Agent } from "@openai/agents";
import { getModelName } from "../config/openai.js";
import { sharedMongoRules } from "./baseInstructions.js";
import { updateTools } from "./tools/movieTools.js";

export function createUpdateAgent() {
  return new Agent({
    name: "MongoDB Update Agent",
    instructions: [
      sharedMongoRules(),
      "Your only job is UPDATE operations using update_movies.",
      "Always use a precise filter object; pass only fields to change in update.",
      "Report matchedCount and modifiedCount from the tool result.",
    ].join("\n"),
    model: getModelName(),
    tools: updateTools,
    modelSettings: {
      toolChoice: "required",
      temperature: 0.2,
    },
  });
}
