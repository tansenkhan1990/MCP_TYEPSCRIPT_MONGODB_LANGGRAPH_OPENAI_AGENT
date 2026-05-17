import { duckDuckGoSearchTool } from "./tools/duckduckgo/tool.js";

const MONGO_MODEL_SETTINGS = {
  toolChoice: "required",
  temperature: 0.2,
};

const WEB_MODEL_SETTINGS = {
  toolChoice: "required",
  temperature: 0.3,
};

export const AGENT_DEFINITIONS = {
  read: {
    name: "MongoDB Read Agent (MCP)",
    useMongoRules: true,
    roleInstructions:
      "Your only job is READ operations via MCP: find, aggregate, count, list-databases, list-collections, collection-schema.\nDo not insert, update, or delete documents.\nReturn concise summaries plus key fields from tool results.",
    modelSettings: MONGO_MODEL_SETTINGS,
  },
  create: {
    name: "MongoDB Create Agent (MCP)",
    useMongoRules: true,
    roleInstructions:
      "Your only job is CREATE operations via MCP: insert-many (and create-collection only when explicitly requested).\nUse insert-many for one or many documents. Validate document shape before insert.\nSummarize inserted count and example _id values from tool output.",
    modelSettings: MONGO_MODEL_SETTINGS,
  },
  update: {
    name: "MongoDB Update Agent (MCP)",
    useMongoRules: true,
    roleInstructions:
      "Your only job is UPDATE operations via MCP: update-many.\nAlways use a precise filter. Prefer $set for partial updates unless the user specifies otherwise.\nReport matched and modified document counts from tool results.",
    modelSettings: MONGO_MODEL_SETTINGS,
  },
  delete: {
    name: "MongoDB Delete Agent (MCP)",
    useMongoRules: true,
    roleInstructions:
      "Your only job is DELETE operations via MCP: delete-many.\nNever drop an entire database unless the user explicitly requests it.\nUse a narrow filter for delete-many; report deleted count from tool results.",
    modelSettings: MONGO_MODEL_SETTINGS,
  },
  web: {
    name: "Web Search Agent (DuckDuckGo)",
    useMongoRules: false,
    roleInstructions: [
      "You are a web research specialist.",
      "Use the duckduckgo_search tool to find up-to-date information on the public internet.",
      "Always call duckduckgo_search once with a focused query before answering.",
      "Summarize the tool output in clear prose and cite source titles or URLs from the results.",
      "Do not invent search results — only report what the tool returns.",
      "If the user asks about MongoDB databases or collections, say they should rephrase without web-search keywords so the database agent can help.",
    ].join("\n"),
    tools: [duckDuckGoSearchTool],
    modelSettings: WEB_MODEL_SETTINGS,
  },
};
