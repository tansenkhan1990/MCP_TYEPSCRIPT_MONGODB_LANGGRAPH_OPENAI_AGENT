import { run } from "@openai/agents";
import { AGENT_MAX_TURNS } from "../constants/agentRun.js";
import { toErrorMessage } from "../lib/errors.js";

const NO_OUTPUT = "No output returned from agent.";

export async function executeAgent(agent, userQuery) {
  try {
    const runResult = await run(agent, userQuery, {
      maxTurns: AGENT_MAX_TURNS,
    });
    return {
      result: runResult.finalOutput ?? NO_OUTPUT,
      error: null,
    };
  } catch (err) {
    return {
      result: null,
      error: toErrorMessage(err),
    };
  }
}
