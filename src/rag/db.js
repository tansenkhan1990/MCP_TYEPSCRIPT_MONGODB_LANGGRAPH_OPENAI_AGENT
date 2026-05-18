import { connectDatabase } from "../seed/connect.js";
import { ensureRagCollections } from "./ensureRagCollections.js";
import { getVectorlessRagModel } from "./schemas/vectorlessRag.schema.js";

export async function getRagModel() {
  await ensureRagCollections();
  await connectDatabase();
  return getVectorlessRagModel();
}
