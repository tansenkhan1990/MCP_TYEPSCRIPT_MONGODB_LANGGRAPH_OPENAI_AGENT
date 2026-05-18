import { env } from "../config/env.js";
import { VECTORLESS_RAG_COLLECTION } from "./rag.js";

/** Registered internal / company data stores the agent can search. */
export const INTERNAL_DATA_SOURCES = [
  {
    id: "movies",
    type: "mongodb",
    label: "Movie catalog",
    database: () => env.mongoDbName,
    collection: () => env.mongoCollection,
    description: "Structured movie records (title, year, genres, plot, etc.)",
  },
  {
    id: "company_pdfs",
    type: "rag",
    label: "Uploaded company PDFs",
    database: () => env.mongoDbName,
    collection: () => VECTORLESS_RAG_COLLECTION,
    description: "PDF documents ingested for full-text keyword search",
  },
];
