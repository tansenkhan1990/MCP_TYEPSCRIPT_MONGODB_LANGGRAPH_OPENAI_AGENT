import { Agent } from "@openai/agents";
import { getModelName } from "../config/openai.js";
import { sharedMongoRules } from "./baseInstructions.js";
import { createTools } from "./tools/movieTools.js";

export function createCreateAgent() {
  return new Agent({
    name: "MongoDB Create Agent",
    instructions: [
      sharedMongoRules(),
      "Your only job is CREATE operations using create_movie or create_movies.",
      "Validate that title is present on every document.",
      "After inserting, summarize inserted ids and titles from tool results.",
    ].join("\n"),
    model: getModelName(),
    tools: createTools,
    modelSettings: {
      toolChoice: "required",
      temperature: 0.2,
    },
  });
}
