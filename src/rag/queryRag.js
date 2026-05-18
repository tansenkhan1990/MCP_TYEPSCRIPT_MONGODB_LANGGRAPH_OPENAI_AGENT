import { VECTORLESS_RAG_COLLECTION } from "../constants/rag.js";
import { escapeRegex } from "../lib/escapeRegex.js";
import { requireNonEmptyQuestion, toHandlerResult } from "../lib/handlerResult.js";
import { chatWithMessages } from "../lib/llmChat.js";
import { rankChunksByQuery } from "../lib/ragChunks.js";
import { getRagModel } from "./db.js";

const MAX_DOCUMENTS = 2;

function buildContext(documents, query) {
  const parts = [];

  for (const doc of documents) {
    const ranked = rankChunksByQuery(doc.chunks ?? [], query);
    const chunks = ranked.length ? ranked : (doc.chunks ?? []).slice(0, 3);

    parts.push(
      `--- ${doc.fileName} (${doc.description ?? "uploaded PDF"}) ---`,
      ...chunks.map((chunk) => chunk.text.trim()),
    );
  }

  return parts.join("\n\n");
}

async function findRelevantDocuments(query) {
  const Model = await getRagModel();

  const textResults = await Model.find(
    { $text: { $search: query } },
    {
      score: { $meta: "textScore" },
      fileName: 1,
      description: 1,
      chunks: 1,
    },
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(MAX_DOCUMENTS)
    .lean();

  if (textResults.length > 0) {
    return textResults.map((doc) => ({
      ...doc,
      chunks: rankChunksByQuery(doc.chunks ?? [], query),
    }));
  }

  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);

  if (terms.length === 0) {
    return Model.find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .select({ fileName: 1, description: 1, chunks: 1 })
      .lean();
  }

  const regex = new RegExp(
    terms.slice(0, 5).map((term) => escapeRegex(term)).join("|"),
    "i",
  );
  const regexResults = await Model.find({
    $or: [
      { fullText: regex },
      { "chunks.text": regex },
      { fileName: regex },
      { description: regex },
    ],
  })
    .limit(MAX_DOCUMENTS)
    .select({ fileName: 1, description: 1, chunks: 1 })
    .lean();

  return regexResults.map((doc) => ({
    ...doc,
    chunks: rankChunksByQuery(doc.chunks ?? [], query),
  }));
}

export function queryRag(userQuery) {
  return toHandlerResult(async () => {
    const check = requireNonEmptyQuestion(userQuery);
    if (check.error) {
      return check;
    }

    const { question } = check;
    const documents = await findRelevantDocuments(question);

    if (documents.length === 0) {
      return {
        result: null,
        error: `No documents in ${VECTORLESS_RAG_COLLECTION}. Upload a PDF first via POST /api/upload-pdf.`,
      };
    }

    const context = buildContext(documents, question);
    if (!context.trim()) {
      return { result: null, error: "Matching documents have no readable text chunks." };
    }

    const answer = await chatWithMessages([
      {
        role: "system",
        content:
          "Answer using only the provided PDF excerpts. If information is missing, say so. Do not invent facts.",
      },
      {
        role: "user",
        content: `Context from ${VECTORLESS_RAG_COLLECTION}:\n\n${context}\n\nQuestion: ${question}`,
      },
    ]);

    const sources = documents.map((doc) => doc.fileName).join(", ");
    return {
      result: `${answer || "No answer returned from the model."}\n\nSources: ${sources}`,
      error: null,
    };
  });
}
