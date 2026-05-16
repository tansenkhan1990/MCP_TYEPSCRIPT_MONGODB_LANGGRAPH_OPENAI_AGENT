# MongoDB Atlas CRUD Agents

[![CI](https://github.com/tansenkhan1990/MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT/actions/workflows/ci.yml/badge.svg)](https://github.com/tansenkhan1990/MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT/actions/workflows/ci.yml)

Multi-agent system for natural-language **Create, Read, Update, and Delete** operations on **MongoDB Atlas**. Built with **LangGraph** (workflow routing), **OpenAI Agents SDK** (specialist agents), and **Mongoose** (schema + CRUD). On startup the app **creates the database/collection if missing** and seeds sample movies when empty.

Ask questions in plain English via the **CLI** or **Express REST API**. LangGraph classifies each request and routes it to the correct specialist agent.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [How routing works](#how-routing-works)
- [Mongoose schema and database init](#mongoose-schema-and-database-init)
- [Agents and tools](#agents-and-tools)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the project](#running-the-project)
- [CLI usage](#cli-usage)
- [REST API](#rest-api)
- [Example prompts](#example-prompts)
- [Request lifecycle](#request-lifecycle)
- [Project structure](#project-structure)
- [npm scripts](#npm-scripts)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Four specialist agents** — one each for read, create, update, and delete
- **LangGraph workflow** — automatic routing based on your question
- **Mongoose CRUD** — typed movie schema; auto-creates `sample_mflix.movies` (configurable)
- **Auto-seed** — inserts 2 sample movies when the collection is empty
- **Least-privilege agent tools** — each agent only sees tools for its operation
- **Ollama or OpenAI** — any OpenAI-compatible Chat Completions API
- **CLI and HTTP API** — interactive terminal or `POST /api/query`
- **Tracing disabled by default** — no OpenAI trace export when using local models

---

## Tech stack

| Layer | Package / service |
|-------|-------------------|
| Workflow | [@langchain/langgraph](https://www.npmjs.com/package/@langchain/langgraph) |
| Agents | [@openai/agents](https://www.npmjs.com/package/@openai/agents) |
| ODM | [Mongoose](https://www.npmjs.com/package/mongoose) |
| HTTP API | [Express](https://expressjs.com/) 5.x |
| LLM | Ollama (default) or OpenAI API |
| Runtime | Node.js 20.19+ (ES modules) |

---

## Architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    CLI[CLI - npm start]
    API[Express API - npm run api]
  end

  subgraph workflow [LangGraph workflow]
    Route[route node]
    ReadN[read_agent]
    CreateN[create_agent]
    UpdateN[update_agent]
    DeleteN[delete_agent]
    Route -->|read| ReadN
    Route -->|create| CreateN
    Route -->|update| UpdateN
    Route -->|delete| DeleteN
  end

  subgraph agents [OpenAI Agents SDK]
    RA[MongoDB Read Agent]
    CA[MongoDB Create Agent]
    UA[MongoDB Update Agent]
    DA[MongoDB Delete Agent]
  end

  subgraph data [Mongoose]
    Schema[movie.schema.js]
    SVC[movie.service.js]
  end

  Atlas[(MongoDB Atlas)]

  CLI --> executeQuery
  API --> executeQuery
  executeQuery --> Init[ensureDatabase]
  Init --> Atlas
  executeQuery --> Route
  ReadN --> RA
  CreateN --> CA
  UpdateN --> UA
  DeleteN --> DA
  RA & CA & UA & DA --> SVC
  SVC --> Schema
  Schema --> Atlas
```

**High-level flow**

1. `ensureDatabase()` connects with Mongoose, creates the collection if needed, seeds when empty.
2. LangGraph **route** node classifies the operation: `read` | `create` | `update` | `delete`.
3. The matching **agent** runs with Mongoose function tools (`find_movies`, `create_movie`, etc.).
4. The final answer and `operation` are returned to the client.

---

## How routing works

Routing is implemented in `src/workflow/router.js` using keyword pattern scoring (no extra LLM call for routing).

| Operation | Example keywords |
|-----------|------------------|
| **read** | find, get, list, show, search, query, count, aggregate, how many, what is |
| **create** | create, insert, add, seed, register |
| **update** | update, modify, change, set, patch, edit, replace |
| **delete** | delete, remove, drop, purge, clear |

Rules:

- The operation with the **highest pattern score** wins.
- If nothing matches, defaults to **read**.
- On a tie, priority is: `delete` → `update` → `create` → `read`.

The API and CLI responses include `operation` so you can see which route was chosen.

---

## Mongoose schema and database init

| File | Purpose |
|------|---------|
| `src/schemas/movie.schema.json` | JSON Schema (documentation / validation reference) |
| `src/schemas/movie.schema.js` | Mongoose schema + `getMovieModel()` |
| `src/db/connect.js` | Atlas connection via `MONGO_DB_CONNECTION_STRING` + `MONGO_DB_NAME` |
| `src/db/init.js` | Creates collection if missing, builds indexes, seeds 2 movies when empty |
| `src/services/movie.service.js` | `find`, `count`, `create`, `update`, `delete` helpers |

Initialize without starting the API:

```bash
npm run db:init
```

MongoDB creates the **database** on first write; `init.js` explicitly creates the **collection** and seed data.

Default target (from `.env`): **`sample_mflix.movies`**

## Agents and tools

Each agent uses **Mongoose function tools** (`src/agents/tools/movieTools.js`):

| Agent | Route | Tools |
|-------|-------|-------|
| **Read** | `read` | `find_movies`, `count_movies`, `get_movie_by_id` |
| **Create** | `create` | `create_movie`, `create_movies` |
| **Update** | `update` | `update_movies` |
| **Delete** | `delete` | `delete_movies` |

---

## Prerequisites

1. **Node.js** 20.19.0 or newer (22.12+ if using Node 22)
2. **MongoDB Atlas** cluster and connection string
3. **LLM provider** (choose one):
   - **Ollama** (recommended for local dev): [https://ollama.com](https://ollama.com)
   - **OpenAI API** or any OpenAI-compatible endpoint

For Ollama:

```bash
ollama serve
ollama pull <your-model>   # must match LOCAL_MODEL_NAME in .env
```

Ensure your Atlas cluster allows connections from your IP ([Network Access](https://www.mongodb.com/docs/atlas/security/ip-access-list/)).

---

## Installation

```bash
git clone <your-repo-url>
cd MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT

npm install
cp .env.example .env
```

Edit `.env` with your Atlas connection string, model name, and optional defaults.

---

## Configuration

Copy `.env.example` to `.env` and set the values below.

### Required

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | API key (`ollama` for local Ollama, or your OpenAI key) |
| `MONGO_DB_CONNECTION_STRING` | MongoDB Atlas URI, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/` |

### Recommended

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | LLM base URL; use `http://localhost:11434/v1` for Ollama |
| `LOCAL_MODEL_NAME` | `gpt-4o-mini` | Model id passed to every agent |
| `MONGO_DB_NAME` | `sample_mflix` | Database name (created on first write) |
| `MONGO_COLLECTION` | `movies` | Collection name for the Movie model |
| `PORT` | `3000` | Express API listen port |

### Optional

| Variable | Description |
|----------|-------------|
| `OPENAI_AGENTS_DISABLE_TRACING` | Set to `1` to disable OpenAI Agents tracing (default applied in code) |
| `OPENAI_DISABLE_TELEMETRY` | Reduces SDK telemetry |
| `LOCAL_EMBEDDING_MODEL` | Reserved for future use; not used by current agents |

### Example `.env` (Ollama + Atlas)

```env
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
OPENAI_AGENTS_DISABLE_TRACING=1
OPENAI_DISABLE_TELEMETRY=true
LOCAL_MODEL_NAME=llama3.2
MONGO_DB_CONNECTION_STRING=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/
MONGO_DB_NAME=sample_mflix
MONGO_COLLECTION=movies
PORT=3000
```

Never commit `.env` to version control.

---

## Running the project

Start **Ollama** (if used) and ensure Atlas is reachable, then:

| Mode | Command |
|------|---------|
| **Init DB + seed** | `npm run db:init` |
| **API server** | `npm run api` |
| **API (watch mode)** | `npm run api:dev` |
| **CLI one-shot** | `npm start -- "your question"` |
| **CLI interactive** | `npm start` |
| **CLI (watch mode)** | `npm run dev` |

Typical first request (API or CLI) takes **15–30+ seconds** while MCP connects and the model runs tool calls.

---

## CLI usage

### One-shot

```bash
npm start -- "List all database names"
```

### Interactive REPL

```bash
npm start
```

```
You> Find 5 movies in sample_mflix.movies where year > 2010
```

Type `exit` or `quit` to leave.

### Sample output

```
Routing request through LangGraph workflow...

Operation: read

--- Agent response ---

...
```

---

## REST API

Start the server:

```bash
npm run api
```

Base URL: `http://localhost:3000` (or your `PORT`).

### `GET /health`

Liveness check.

**Response `200`**

```json
{
  "status": "ok",
  "model": "llama3.2"
}
```

### `POST /api/query`

Run a natural-language MongoDB operation. LangGraph routes to the correct agent.

**Headers**

```
Content-Type: application/json
```

**Body** (either field is accepted)

```json
{
  "question": "Find 3 movies from sample_mflix.movies"
}
```

```json
{
  "query": "Insert a document into sample_mflix.movies with title Demo and year 2026"
}
```

**Success `200`**

```json
{
  "operation": "read",
  "result": "Agent natural-language answer with query outcome..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `operation` | `string` | Routed operation: `read`, `create`, `update`, or `delete` |
| `result` | `string` | Final agent message |

**Client error `400`**

```json
{
  "error": "Request body must include a non-empty \"question\" or \"query\" string."
}
```

**Server error `500`**

Agent or workflow failure:

```json
{
  "operation": "read",
  "result": null,
  "error": "Error message"
}
```

Unhandled exception:

```json
{
  "error": "Error message"
}
```

**Not found `404`**

```json
{
  "error": "Not found"
}
```

### cURL examples

```bash
# Health
curl http://localhost:3000/health

# Read
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "List all databases"}'

# Create
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Insert a movie { \"title\": \"Agent Demo\", \"year\": 2026 } into sample_mflix.movies"}'

# Update
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Set year to 2027 for movies titled Agent Demo in sample_mflix.movies"}'

# Delete
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Delete movies with title Agent Demo from sample_mflix.movies"}'
```

### JavaScript (fetch)

```javascript
const res = await fetch("http://localhost:3000/api/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "Count documents in sample_mflix.movies",
  }),
});

const data = await res.json();
console.log(data.operation, data.result);
```

### Postman

1. Method: **POST**
2. URL: `http://localhost:3000/api/query`
3. Body → **raw** → **JSON**:

```json
{
  "question": "Find 5 movies in sample_mflix.movies"
}
```

---

## Example prompts

Include **database** and **collection** in the question when possible (e.g. `sample_mflix.movies`).

| Operation | Example |
|-----------|---------|
| Read | `Find 5 movies in sample_mflix.movies where year > 2010` |
| Read | `How many documents are in sample_mflix.movies?` |
| Read | `List all collections in sample_mflix` |
| Create | `Insert a movie with title "Agent Demo" and year 2026 into sample_mflix.movies` |
| Update | `Set genre to "demo" for movies titled "Agent Demo" in sample_mflix.movies` |
| Delete | `Delete movies with title "Agent Demo" from sample_mflix.movies` |

---

## Request lifecycle

```mermaid
sequenceDiagram
  participant C as Client
  participant E as executeQuery
  participant G as LangGraph
  participant A as Specialist Agent
  participant M as MongoDB MCP
  participant D as Atlas

  C->>E: question
  E->>G: invoke workflow
  G->>G: classify operation
  G->>A: run agent node
  A->>M: connect stdio MCP
  A->>M: tool calls find / insert / etc.
  M->>D: MongoDB operations
  D-->>M: results
  M-->>A: tool outputs
  A-->>G: finalOutput
  G-->>E: operation + result
  E-->>C: JSON or console output
```

Shared entry point: `src/workflow/executeQuery.js` (used by CLI and API).

---

## Project structure

```
.
├── .env.example          # Environment template
├── package.json
├── README.md
└── src/
    ├── bootstrap.js
    ├── index.js              # CLI
    ├── server.js             # Express API
    ├── config/
    ├── db/
    │   ├── connect.js
    │   └── init.js           # create collection + seed
    ├── schemas/
    │   ├── movie.schema.json
    │   └── movie.schema.js
    ├── services/
    │   └── movie.service.js  # Mongoose CRUD
    ├── agents/
    │   ├── tools/movieTools.js
    │   ├── readAgent.js
    │   ├── createAgent.js
    │   ├── updateAgent.js
    │   ├── deleteAgent.js
    │   └── runner.js
    ├── scripts/initDb.js
    └── workflow/
```

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm start` | CLI (interactive or pass question after `--`) |
| `npm run dev` | CLI with Node `--watch` |
| `npm run db:init` | Connect, create collection, seed if empty |
| `npm run verify` | CI-safe router smoke test (no Atlas/Ollama) |
| `npm run api` | Start Express API on `PORT` |
| `npm run api:dev` | API with Node `--watch` |

---

## Security

- **Do not commit** `.env` or expose Atlas credentials.
- Use **least-privilege** Atlas database users (read-only user if you only need reads).
- Restrict **Atlas IP access** to known addresses in production.
- **Delete/drop** tools are available to the delete agent; test carefully.
- The API has **no authentication** — do not expose it publicly without adding auth, rate limits, and HTTPS.

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| `Connection refused` on port 11434 | Start Ollama: `ollama serve` |
| Model not found | `ollama pull <LOCAL_MODEL_NAME>` or fix model name in `.env` |
| MCP request timed out | Retry; confirm Atlas IP allowlist; first MCP start can be slow |
| Only `admin` / `local` before init | Run `npm run db:init` or start API (auto-inits `sample_mflix`) |
| `[Tracing client error 401]` | Tracing should be off; ensure `OPENAI_AGENTS_DISABLE_TRACING=1` and restart |
| API returns 500 | Read `error` in JSON body; check Ollama logs and Atlas connectivity |
| Wrong operation routed | Rephrase with clearer verbs (e.g. "insert" vs "find"); see [How routing works](#how-routing-works) |

---

## License

MIT
