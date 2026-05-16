import express from "express";
import { env } from "../config/env.js";
import { toErrorMessage } from "../lib/errors.js";
import { parseQuestionFromBody } from "../lib/parseQuestion.js";
import { executeQuery } from "../workflow/executeQuery.js";

export function createApp() {
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
    const trimmed = parseQuestionFromBody(req.body);
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
      return res.status(500).json({ error: toErrorMessage(err) });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
