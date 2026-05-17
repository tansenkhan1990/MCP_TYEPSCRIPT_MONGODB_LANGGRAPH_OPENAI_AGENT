import { tool } from "@openai/agents";
import { z } from "zod";
import { searchDuckDuckGo } from "./search.js";

export const duckDuckGoSearchTool = tool({
  name: "duckduckgo_search",
  description:
    "Search the public web with DuckDuckGo. Use for current events, facts, or anything not in MongoDB.",
  parameters: z.object({
    query: z.string().describe("Short search query for DuckDuckGo"),
  }),
  execute: async ({ query }) => searchDuckDuckGo(query),
});
