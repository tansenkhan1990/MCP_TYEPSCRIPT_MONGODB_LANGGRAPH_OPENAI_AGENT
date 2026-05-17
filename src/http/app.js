import express from "express";
import { env } from "../config/env.js";
import { OPERATIONS } from "../constants/operations.js";
import { toErrorMessage } from "../lib/errors.js";
import { parseQuestionFromBody } from "../lib/parseQuestion.js";
import { executeQuery } from "../workflow/executeQuery.js";
import { formatQueryError, formatQuerySuccess } from "./formatResponse.js";
import { lenientBodyParser } from "./lenientBodyParser.js";

export function createApp() {
  const app = express();

  app.use(lenientBodyParser);

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      model: env.modelName,
      database: env.mongoDbName,
      collection: env.mongoCollection,
      operations: OPERATIONS,
    });
  });

  app.post("/api/query", async (req, res) => {
    const question = parseQuestionFromBody(req.body);
    if (!question) {
      return res.status(400).json({
        error: 'Request body must include a non-empty "question" string.',
        example: { question: "Search the web for Germany latest news today" },
      });
    }

    try {
      const outcome = await executeQuery(question);

      if (outcome.error) {
        return res.status(500).json(formatQueryError(outcome));
      }

      return res.json(formatQuerySuccess(outcome));
    } catch (err) {
      return res.status(500).json({ error: toErrorMessage(err) });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: toErrorMessage(err) });
  });

  return app;
}
