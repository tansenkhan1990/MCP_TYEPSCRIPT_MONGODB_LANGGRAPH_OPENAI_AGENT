import "../bootstrap.js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parsePort(value) {
  const port = Number.parseInt(value ?? "3000", 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
}

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(value ?? String(fallback), 10);
  if (!Number.isFinite(n) || n < 1) {
    return fallback;
  }
  return n;
}

export const env = {
  openaiBaseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  modelName: process.env.LOCAL_MODEL_NAME?.trim() || "gpt-4o-mini",
  mongoConnectionString: requireEnv("MONGO_DB_CONNECTION_STRING"),
  mongoDbName: process.env.MONGO_DB_NAME?.trim() || "sample_mflix",
  mongoCollection: process.env.MONGO_COLLECTION?.trim() || "movies",
  port: parsePort(process.env.PORT),
  pdfMaxUploadBytes: parsePositiveInt(process.env.PDF_MAX_UPLOAD_MB, 15) * 1024 * 1024,
  ragChunkSize: parsePositiveInt(process.env.RAG_CHUNK_SIZE, 1000),
  ragChunkOverlap: parsePositiveInt(process.env.RAG_CHUNK_OVERLAP, 150),
};
