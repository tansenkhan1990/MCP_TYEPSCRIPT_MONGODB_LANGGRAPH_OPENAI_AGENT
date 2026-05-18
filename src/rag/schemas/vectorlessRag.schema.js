import mongoose from "mongoose";
import { VECTORLESS_RAG_COLLECTION } from "../../constants/rag.js";
import { ragChunkSchema, ragDocumentBaseFields } from "./shared.js";

const vectorlessRagSchema = new mongoose.Schema(
  {
    ...ragDocumentBaseFields,
    fullText: { type: String, required: true },
    chunks: { type: [ragChunkSchema], required: true },
  },
  {
    timestamps: true,
    collection: VECTORLESS_RAG_COLLECTION,
  },
);

vectorlessRagSchema.index({ fileName: 1 });
vectorlessRagSchema.index({ createdAt: -1 });
vectorlessRagSchema.index({ fullText: "text", "chunks.text": "text" });

export function getVectorlessRagModel() {
  if (mongoose.models.VectorlessRagDocument) {
    return mongoose.models.VectorlessRagDocument;
  }
  return mongoose.model("VectorlessRagDocument", vectorlessRagSchema);
}
