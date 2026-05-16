import { Agent } from "@openai/agents";
import { getModelName } from "../config/openai.js";
import { sharedMongoRules } from "./baseInstructions.js";
import { readTools } from "./tools/movieTools.js";

export function createReadAgent() {
  return new Agent({
    name: "MongoDB Read Agent",
    instructions: [
      sharedMongoRules(),
      "Your only job is READ operations using find_movies, count_movies, and get_movie_by_id.",
      "Do not insert, update, or delete documents.",
      "Return concise summaries plus key fields from tool results.",
    ].join("\n"),
    model: getModelName(),
    tools: readTools,
    modelSettings: {
      toolChoice: "required",
      temperature: 0.2,
    },
  });
}
