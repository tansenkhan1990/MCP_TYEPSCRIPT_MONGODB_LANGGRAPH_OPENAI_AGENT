# MongoDB Atlas CRUD Agents

Multi-agent system for natural-language **Create, Read, Update, and Delete** operations on **MongoDB Atlas**. Built with **LangGraph** (workflow routing), **OpenAI Agents SDK** (four specialist agents), and the official **MongoDB MCP Server** (all CRUD via MCP tools). Optional `npm run db:init` uses Mongoose only to seed sample data.

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
- [Git workflow (manual)](#git-workflow-manual)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Four specialist agents** — one each for read, create, update, and delete
- **LangGraph workflow** — automatic routing based on your question
- **MongoDB MCP CRUD** — `find`, `insert-many`, `update-many`, `delete-many` via official MCP server
- **Filtered MCP tools per agent** — least-privilege tool allowlists per operation
- **Optional Mongoose seed** — `npm run db:init` creates collection + sample movies for demos
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
| Database (agents) | [mongodb-mcp-server](https://www.npmjs.com/package/mongodb-mcp-server) via MCP stdio |
| Optional seed | [Mongoose](https://www.npmjs.com/package/mongoose) (`npm run db:init` only) |
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

  subgraph mcp [MongoDB MCP stdio]
    MCPRead[read tools]
    MCPCreate[create tools]
    MCPUpdate[update tools]
    MCPDelete[delete tools]
  end

  Atlas[(MongoDB Atlas)]

  CLI --> executeQuery
  API --> executeQuery
  executeQuery --> Route
  ReadN --> RA
  CreateN --> CA
  UpdateN --> UA
  DeleteN --> DA
  RA --> MCPRead
  CA --> MCPCreate
  UA --> MCPUpdate
  DA --> MCPDelete
  MCPRead & MCPCreate & MCPUpdate & MCPDelete --> Atlas
```

**High-level flow**

1. LangGraph **route** node classifies the operation: `read` | `create` | `update` | `delete`.
2. The matching agent node starts a **filtered MongoDB MCP server** (stdio), connects, and runs the OpenAI Agent.
3. The agent calls MCP tools (`find`, `insert-many`, `update-many`, `delete-many`, etc.) against Atlas.
4. MCP disconnects; the final answer and `operation` are returned (`dataLayer: "mcp"`).

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

## MongoDB MCP integration

| File | Purpose |
|------|---------|
| `src/mcp/mongodbServer.js` | `MCPServerStdio` + per-operation tool allowlists |
| `src/mcp/context.js` | Default database/collection hints for agent instructions |

MCP runs **without** `--readOnly` so create/update/delete tools are available. Each agent only receives tools for its operation.

| Agent | Route | MCP tools (allowlist) |
|-------|-------|------------------------|
| **Read** | `read` | `find`, `aggregate`, `count`, `list-databases`, `list-collections`, … |
| **Create** | `create` | `insert-many`, `create-collection`, `create-index` |
| **Update** | `update` | `update-many`, `rename-collection` |
| **Delete** | `delete` | `delete-many`, `drop-collection`, `drop-index` |

### Optional: seed data with Mongoose (`npm run db:init`)

Agents use **MCP only**. For demo data, optionally run:

```bash
npm run db:init
```

This uses Mongoose (`src/db/init.js`, `src/schemas/movie.schema.js`) to create the collection and insert 2 sample movies if empty. It does **not** affect the agent MCP path.

Default target (from `.env`): **`sample_mflix.movies`**

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
git clone https://github.com/tansenkhan1990/MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT.git
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

Typical first request (API or CLI) takes **15–30+ seconds** while the MCP server starts, connects to Atlas, and the model runs tool calls.

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
  -d '{"question": "Find all movies in sample_mflix.movies"}'

# Create a movie
# Prerequisite: npm run api (and Ollama running). DB/collection are created on first request if missing.
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Create a movie in sample_mflix.movies with title Agent Demo, year 2026, genres [\"Sci-Fi\", \"Drama\"], and plot A test movie inserted via the API"}'
```

**Expected response (create):**

```json
{
  "operation": "create",
  "result": "... summary with insertedId and title ...",
  "database": "sample_mflix",
  "collection": "movies"
}
```

**More create examples** (same endpoint, change the `question`):

```bash
# Minimal — title + year only
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Insert a movie with title My New Film and year 2025 into sample_mflix.movies"}'

# Multiple fields — helps the create agent map to the Mongoose schema
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Add a movie to sample_mflix.movies: title=\"Night Run\", year=2024, rated=\"PG-13\", runtime=110, genres=[\"Action\"]"}'
```

**Verify the insert (read):**

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Find movies in sample_mflix.movies where title is Agent Demo"}'

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
  G->>A: connect MCP + run agent
  A->>M: find / insert-many / update-many / delete-many
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
    ├── mcp/
    │   ├── mongodbServer.js    # MCPServerStdio + tool filters
    │   └── context.js
    ├── db/                   # optional seed only
    │   ├── connect.js
    │   └── init.js
    ├── schemas/              # optional seed only
    ├── agents/
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
| `npm run verify` | Local router smoke test (no Atlas/Ollama) |
| `npm run api` | Start Express API on `PORT` |
| `npm run api:dev` | API with Node `--watch` |

---

## Git workflow (manual)

This project does **not** use GitHub Actions, Dependabot, or `gh` CLI. Commit and push with standard **git** only.

### First-time setup

```bash
git clone https://github.com/tansenkhan1990/MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT.git
cd MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT
```

### After you change code

```bash
git status
git add .
git commit -m "Describe your change"
git push origin main
```

### Before every commit

- Do **not** add `.env` (secrets stay local; only `.env.example` is tracked).
- Run `npm run verify` optionally (quick local check).
- Run `npm run api` or `npm run db:init` to test against Atlas when relevant.

### Remote

Default remote (if already configured):

```text
origin  https://github.com/tansenkhan1990/MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT.git
```

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
| Atlas connection failed | Check connection string, IP allowlist, and DB user permissions |
| Only `admin` / `local` before init | Run `npm run db:init` or start API (auto-inits `sample_mflix`) |
| `[Tracing client error 401]` | Tracing should be off; ensure `OPENAI_AGENTS_DISABLE_TRACING=1` and restart |
| API returns 500 | Read `error` in JSON body; check Ollama logs and Atlas connectivity |
| Wrong operation routed | Rephrase with clearer verbs (e.g. "insert" vs "find"); see [How routing works](#how-routing-works) |

---

## License

MIT
