/**
 * Must load before @openai/agents so OPENAI_AGENTS_DISABLE_TRACING is visible to the SDK.
 */
import "dotenv/config";

if (!process.env.OPENAI_AGENTS_DISABLE_TRACING) {
  process.env.OPENAI_AGENTS_DISABLE_TRACING = "1";
}
