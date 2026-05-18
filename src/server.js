import "./bootstrap.js";
import { env } from "./config/env.js";
import { createApp } from "./http/app.js";

const app = createApp();

app.listen(env.port, () => {
  console.log(`MongoDB agent API (LangGraph + OpenAI Agents + MCP)`);
  console.log(`Listening on http://localhost:${env.port}`);
  console.log(`Target: ${env.mongoDbName}.${env.mongoCollection}`);
  console.log(`POST http://localhost:${env.port}/api/query`);
  console.log(`POST http://localhost:${env.port}/api/upload-pdf`);
  console.log(`GET  http://localhost:${env.port}/health`);
  console.log(`Optional seed: npm run db:init`);
});
