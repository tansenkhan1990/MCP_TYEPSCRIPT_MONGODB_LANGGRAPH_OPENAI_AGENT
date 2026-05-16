import "./bootstrap.js";
import "./config/tracing.js";
import express from "express";
import { configureOpenAI } from "./config/openai.js";
import { env } from "./config/env.js";
import { executeQuery } from "./workflow/executeQuery.js";
import { ensureDatabase } from "./db/init.js";

configureOpenAI();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    model: env.modelName,
    database: env.mongoDbName,
    collection: env.mongoCollection,
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
      });
    }

    return res.json({
      operation: outcome.operation,
      result: outcome.result,
      database: outcome.database,
      collection: outcome.collection,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

async function start() {
  const dbInfo = await ensureDatabase();
  console.log(
    `Mongoose connected: ${dbInfo.database}.${dbInfo.collection} (${dbInfo.documentCount} docs${dbInfo.seeded ? ", seeded" : ""})`,
  );

  app.listen(env.port, () => {
    console.log(`MongoDB agent API listening on http://localhost:${env.port}`);
    console.log(`POST http://localhost:${env.port}/api/query`);
    console.log(`GET  http://localhost:${env.port}/health`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
