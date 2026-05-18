import { VECTORLESS_RAG_COLLECTION } from "../constants/rag.js";
import { connectDatabase } from "../seed/connect.js";
import { getVectorlessRagModel } from "./schemas/vectorlessRag.schema.js";

async function ensureCollection(db, name) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(name);
  }
}

export async function ensureRagCollections() {
  const connection = await connectDatabase();
  const db = connection.db;

  await ensureCollection(db, VECTORLESS_RAG_COLLECTION);
  await getVectorlessRagModel().createIndexes();

  return { collection: VECTORLESS_RAG_COLLECTION };
}
