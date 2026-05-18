import mongoose from "mongoose";

export const ragChunkSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

export const ragDocumentBaseFields = {
  fileName: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  mimeType: { type: String, default: "application/pdf" },
  pageCount: { type: Number },
  textLength: { type: Number },
  chunkCount: { type: Number, required: true },
};
