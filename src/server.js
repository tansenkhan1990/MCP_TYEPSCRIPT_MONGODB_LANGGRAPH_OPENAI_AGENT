import "./bootstrap.js";
import "./config/tracing.js";
import express from "express";
import { configureOpenAI } from "./config/openai.js";
import { env } from "./config/env.js";
import { executeQuery } from "./workflow/executeQuery.js";

configureOpenAI();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    model: env.modelName,
    database: env.mongoDbName,
    collection: env.mongoCollection,
    dataLayer: "mcp",
    mcpServer: "mongodb-mcp-server",
  });
});

app.post("/api/query", async (req, res) => {
  const question =
    typeof req.body?.question === "string"
      ? req.body.question
      : typeof req.body?.query === "string"
        ? req.body.query
        : "";

  const trimmed = question.trim();
  if (!trimmed) {
    return res.status(400).json({
      error: 'Request body must include a non-empty "question" or "query" string.',
    });
  }

  try {
    const outcome = await executeQuery(trimmed);

    if (outcome.error) {
      return res.status(500).json({
        operation: outcome.operation,
        result: null,
        error: outcome.error,
        database: outcome.database,
        collection: outcome.collection,
        dataLayer: outcome.dataLayer,
      });
    }

    return res.json({
      operation: outcome.operation,
      result: outcome.result,
      database: outcome.database,
      collection: outcome.collection,
      dataLayer: outcome.dataLayer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(env.port, () => {
  console.log(`MongoDB agent API (LangGraph + OpenAI Agents + MCP)`);
  console.log(`Listening on http://localhost:${env.port}`);
  console.log(`Target: ${env.mongoDbName}.${env.mongoCollection}`);
  console.log(`POST http://localhost:${env.port}/api/query`);
  console.log(`GET  http://localhost:${env.port}/health`);
  console.log(`Optional seed: npm run db:init`);
});
