import { env } from "../config/env.js";
import { VECTORLESS_RAG_COLLECTION } from "../constants/rag.js";
import { chunkText } from "../lib/chunkText.js";
import { getRagModel } from "./db.js";
import { extractPdfText } from "./extractPdfText.js";

function resolveDescription(description, fileName) {
  const trimmed = String(description ?? "").trim();
  if (trimmed) {
    return trimmed;
  }
  return `Uploaded ${String(fileName ?? "").trim() || "upload.pdf"}`;
}

export async function uploadPdfDocument({ buffer, fileName, description }) {
  if (!buffer?.length) {
    throw new Error("PDF file is required.");
  }

  const { text, pageCount } = await extractPdfText(buffer);
  const chunks = chunkText(text, env.ragChunkSize, env.ragChunkOverlap);

  if (chunks.length === 0) {
    throw new Error("No text chunks were produced from the PDF.");
  }

  const Model = await getRagModel();
  const doc = await Model.create({
    fileName,
    description: resolveDescription(description, fileName),
    mimeType: "application/pdf",
    pageCount,
    textLength: text.length,
    chunkCount: chunks.length,
    fullText: text,
    chunks,
  });

  return {
    documentId: String(doc._id),
    collection: VECTORLESS_RAG_COLLECTION,
    database: env.mongoDbName,
    fileName: doc.fileName,
    description: doc.description,
    chunkCount: doc.chunkCount,
    pageCount: doc.pageCount,
  };
}
