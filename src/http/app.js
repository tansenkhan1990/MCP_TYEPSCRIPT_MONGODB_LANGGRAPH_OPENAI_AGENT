import express from "express";
import { env } from "../config/env.js";
import { OPERATIONS } from "../constants/operations.js";
import { INTERNAL_DATA_SOURCES } from "../constants/dataSources.js";
import { VECTORLESS_RAG_COLLECTION } from "../constants/rag.js";
import { toErrorMessage } from "../lib/errors.js";
import { parseQuestionFromBody } from "../lib/parseQuestion.js";
import { executeQuery } from "../workflow/executeQuery.js";
import { formatQueryError, formatQuerySuccess } from "./formatResponse.js";
import { lenientBodyParser } from "./lenientBodyParser.js";
import { registerUploadPdfRoute } from "./uploadPdfRoute.js";

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
      ragCollection: VECTORLESS_RAG_COLLECTION,
      internalDataSources: INTERNAL_DATA_SOURCES.map((s) => ({
        id: s.id,
        label: s.label,
        database: s.database(),
        collection: s.collection(),
      })),
      uploadEndpoint: "POST /api/upload-pdf",
      queryExamples: {
        inventory: 'What company data do we have about KG?',
        rag: 'What does the research paper say about the main findings?',
        movies: 'Find comedy movies in sample_mflix.movies',
      },
    });
  });

  registerUploadPdfRoute(app);

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
