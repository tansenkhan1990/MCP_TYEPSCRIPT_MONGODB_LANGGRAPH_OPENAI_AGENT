# MongoDB Atlas CRUD Agents

Multi-agent system for natural-language **Create, Read, Update, and Delete** on **MongoDB Atlas**. **LangGraph** routes each request; **OpenAI Agents SDK** runs one specialist per operation; the official **MongoDB MCP Server** performs all agent CRUD. Optional `npm run db:init` seeds demo data with Mongoose (agents never use Mongoose).

Ask questions in plain English via the **CLI** or **Express REST API**. LangGraph classifies each request and routes it to the correct specialist agent.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Code organization](#code-organization)
- [How routing works](#how-routing-works)
- [MongoDB MCP integration](#mongodb-mcp-integration)
- [Agents](#agents)
- [Optional seed data (Mongoose)](#optional-seed-data-mongoose)
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

- **Four specialist agents** — one logical agent per CRUD operation (shared factory, per-operation instructions)
- **LangGraph workflow** — automatic routing based on your question (no extra LLM call for routing)
- **MongoDB MCP CRUD** — `find`, `insert-many`, `update-many`, `delete-many` via official MCP server
- **Least-privilege MCP tools** — each operation gets a filtered tool allowlist only
- **Optional Mongoose seed** — `npm run db:init` creates collection + sample movies for demos (agents still use MCP)
- **Ollama or OpenAI** — any OpenAI-compatible Chat Completions API
- **CLI and HTTP API** — interactive terminal or `POST /api/query`
- **Tracing disabled by default** — no OpenAI trace export when using local models

---

## Tech stack

| Layer | Package / service |
|-------|-------------------|
| Workflow | [@langchain/langgraph](https://www.npmjs.com/package/@langchain/langgraph) |
| Agents | [@openai/agents](https://www.npmjs.com/package/@openai/agents) (`Agent`, `run`, MCP) |
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
    Exec[execute_agent]
    Route -->|read/create/update/delete| Exec
  end

  subgraph agents [OpenAI Agents SDK]
    Factory[createMongoAgent]
    RunMCP[runWithMcp]
  end

  subgraph mcp [MongoDB MCP stdio]
    MCP[MCP server per operation]
  end

  Atlas[(MongoDB Atlas)]

  CLI --> executeQuery
  API --> executeQuery
  executeQuery --> Route
  Route --> Exec
  Exec --> RunMCP
  RunMCP --> Factory
  RunMCP --> MCP
  Factory --> MCP
  MCP --> Atlas
```

**High-level flow**

1. **Client** (`src/index.js` CLI or `src/http/app.js` API) calls `executeQuery(question)`.
2. LangGraph **route** node classifies the operation: `read` | `create` | `update` | `delete`.
3. **`execute_agent`** reads `state.operation` and calls `runAgentWithMcp()` — filtered MCP stdio, `createMongoAgent()`, then `run()` with `maxTurns` limit.
4. The agent calls MCP tools (`find`, `insert-many`, `update-many`, `delete-many`, etc.) against Atlas.
5. MCP disconnects; response includes `operation`, `result`, `database`, `collection`, and `dataLayer: "mcp"`.

**Counts**

| Layer | Count | Notes |
|-------|-------|--------|
| LangGraph nodes | 2 | `route` (classify) + `execute_agent` (MCP + Agents SDK) |
| OpenAI agents | 4 | Same factory; different instructions + MCP tool filters |
| MCP servers per request | 1 | Spawned for the routed operation only |

---

## Design and best practices

| Framework | Core concept used | How this project applies it |
|-----------|-------------------|-----------------------------|
| **LangGraph** | State graph, conditional edges | `route` → `execute_agent`; operation stored in state |
| **LangGraph** | Separation of orchestration vs execution | LangGraph routes only; Agents SDK runs tools/LLM |
| **OpenAI Agents SDK** | `Agent` + `run()` | Factory builds agents; `run(agent, input, { maxTurns })` |
| **OpenAI Agents SDK** | MCP tools | `mcpServers` + `MCPServerStdio` per request |
| **OpenAI Agents SDK** | Least privilege | `createMCPToolStaticFilter` per CRUD operation |
| **MCP** | Stdio transport | Spawns `mongodb-mcp-server`; connect → use → close |

**Intentional choices**

- **Keyword router** (not LLM routing) — fast, deterministic, no extra model call; rephrase if misrouted.
- **Four logical agents, one graph executor** — specialists via `definitions.js` + tool filters, not four duplicate graph nodes.
- **MCP per request** — clean isolation; trade-off is cold-start latency.
- **Tracing off** — required for Ollama/local models (`tracing.js` + env).

---

## Code organization

The codebase is split by responsibility so shared logic lives in one place:

| Path | Role |
|------|------|
| `src/constants/operations.js` | `OPERATIONS`, `normalizeOperation()`, LangGraph node ids |
| `src/lib/errors.js` | `toErrorMessage()` for CLI/API |
| `src/lib/parseQuestion.js` | Parse `question` or `query` from JSON body |
| `src/workflow/router.js` | Keyword scoring → `read` \| `create` \| `update` \| `delete` |
| `src/workflow/state.js` | LangGraph state annotation |
| `src/workflow/nodes.js` | `routeNode`, `executeAgentNode` |
| `src/constants/agentRun.js` | `AGENT_MAX_TURNS` for `run()` |
| `src/workflow/graph.js` | Compile graph, `runWorkflow()` |
| `src/workflow/executeQuery.js` | **Single entry** for CLI + API |
| `src/agents/definitions.js` | Per-operation names + instructions |
| `src/agents/factory.js` | `createMongoAgent(operation, mcpServer)` |
| `src/agents/index.js` | Re-exports `Agent`, `run`, factory helpers |
| `src/config/agents.js` | `configureAgentsSdk()` for `@openai/agents` |
| `src/agents/runWithMcp.js` | Connect MCP → `run(agent, input)` → close |
| `src/agents/baseInstructions.js` | Shared MongoDB rules for all agents |
| `src/mcp/toolSets.js` | MCP tool allowlists per operation |
| `src/mcp/mongodbServer.js` | `createMcpServerForOperation()` |
| `src/mcp/context.js` | Default DB/collection hints in prompts |
| `src/cli/` | CLI banner and query output |
| `src/http/app.js` | Express app factory (`createApp()`) |
| `src/seed/` | Optional Mongoose connect + seed (`npm run db:init` only) |
| `src/config/` | `env.js`, `agents.js` (Agents SDK + Ollama client), tracing off |
| `src/bootstrap.js` | Early env + tracing setup |

Entry points stay thin:

- **CLI:** `src/index.js` → `handleQuery()` → `executeQuery()`
- **API:** `src/server.js` → `createApp()` → `executeQuery()`

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
| `src/mcp/mongodbServer.js` | `MCPServerStdio` + per-operation MCP servers |
| `src/mcp/toolSets.js` | Tool allowlists per CRUD operation |
| `src/mcp/context.js` | Default database/collection hints for agent instructions |

MCP runs **without** `--readOnly` so create/update/delete tools are available. Each agent only receives tools for its operation.

| Agent | Route | MCP tools (allowlist) |
|-------|-------|------------------------|
| **Read** | `read` | `find`, `aggregate`, `count`, `list-databases`, `list-collections`, … |
| **Create** | `create` | `insert-many`, `create-collection`, `create-index` |
| **Update** | `update` | `update-many`, `rename-collection` |
| **Delete** | `delete` | `delete-many`, `drop-collection`, `drop-index` |

Full allowlists are defined in `src/mcp/toolSets.js`. Servers are created in `src/mcp/mongodbServer.js` via `createMcpServerForOperation(operation)`.

---

## Agents

All agent behavior uses **`@openai/agents`** (not the standalone Agents `Runner` class):

| SDK export | Used in | Purpose |
|------------|---------|---------|
| `Agent` | `src/agents/factory.js` | Build specialist agents with MCP |
| `run` | `src/agents/runWithMcp.js` | Execute agent loop (`result.finalOutput`) |
| `MCPServerStdio` | `src/mcp/mongodbServer.js` | MongoDB MCP over stdio |
| `createMCPToolStaticFilter` | `src/mcp/mongodbServer.js` | Per-operation tool allowlists |
| `setDefaultOpenAIClient` | `src/config/agents.js` | Ollama / OpenAI HTTP client |
| `setOpenAIAPI` | `src/config/agents.js` | `chat_completions` for Ollama |
| `setTracingDisabled` | `src/config/tracing.js` | No trace export to OpenAI |

Install: `npm install @openai/agents zod`

There are **four logical specialists**, implemented with one factory instead of four duplicate files:

| File | Purpose |
|------|---------|
| `src/agents/definitions.js` | Agent name + role instructions per operation |
| `src/agents/factory.js` | `createMongoAgent(operation, mcpServer)` |
| `src/agents/runWithMcp.js` | Connect MCP → `run(agent, input)` → close |
| `src/agents/baseInstructions.js` | Shared rules (use MCP tools, cite DB/collection) |
| `src/config/agents.js` | `configureAgentsSdk()` — SDK client setup |

To add a new operation you would extend `OPERATIONS` in `constants/operations.js`, add router patterns, tool sets, agent definitions, and LangGraph picks up the new node automatically.

---

## Optional seed data (Mongoose)

Agents use **MCP only**. For demo data, optionally run:

```bash
npm run db:init   # → src/scripts/initDb.js → src/seed/init.js
```

This uses Mongoose only under `src/seed/`:

| File | Purpose |
|------|---------|
| `src/seed/connect.js` | Atlas connection via Mongoose |
| `src/seed/movie.schema.js` | Movie model + indexes |
| `src/seed/movie.schema.json` | JSON Schema reference for document shape |
| `src/seed/init.js` | Create collection if missing, seed 2 movies when empty |
| `src/scripts/initDb.js` | npm script entry for `db:init` |

It does **not** affect the agent path — agents never import `src/seed/`.

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
| `MONGO_COLLECTION` | `movies` | Default collection (agents + seed) |
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
  "model": "llama3.2",
  "database": "sample_mflix",
  "collection": "movies",
  "dataLayer": "mcp",
  "mcpServer": "mongodb-mcp-server"
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
  "result": "Agent natural-language answer with query outcome...",
  "database": "sample_mflix",
  "collection": "movies",
  "dataLayer": "mcp"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `operation` | `string` | Routed operation: `read`, `create`, `update`, or `delete` |
| `result` | `string` | Final agent message |
| `database` | `string` | Target database from `.env` (`MONGO_DB_NAME`) |
| `collection` | `string` | Target collection from `.env` (`MONGO_COLLECTION`) |
| `dataLayer` | `string` | Always `"mcp"` for agent queries |

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
  "error": "Error message",
  "database": "sample_mflix",
  "collection": "movies",
  "dataLayer": "mcp"
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
  "collection": "movies",
  "dataLayer": "mcp"
}
```

**More create examples** (same endpoint, change the `question`):

```bash
# Minimal — title + year only
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Insert a movie with title My New Film and year 2025 into sample_mflix.movies"}'

# Multiple fields — clearer document shape for insert-many
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
  G->>A: runWithMcp (connect MCP + run agent)
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
├── .env.example
├── package.json
├── README.md
└── src/
    ├── bootstrap.js              # Env + tracing before other imports
    ├── index.js                  # CLI entry
    ├── server.js                 # API entry (listen only)
    ├── constants/
    │   └── operations.js         # read | create | update | delete
    ├── config/
    │   ├── env.js
    │   ├── agents.js             # @openai/agents: client + chat_completions
    │   └── tracing.js            # @openai/agents: disable tracing
    ├── lib/
    │   ├── errors.js
    │   └── parseQuestion.js
    ├── cli/
    │   ├── banner.js
    │   └── handleQuery.js
    ├── http/
    │   └── app.js                # createApp() — /health, /api/query
    ├── workflow/
    │   ├── router.js             # classifyOperation()
    │   ├── state.js
    │   ├── nodes.js
    │   ├── graph.js
    │   └── executeQuery.js       # shared by CLI + API
    ├── agents/
    │   ├── index.js              # re-exports Agent, run, factory helpers
    │   ├── definitions.js
    │   ├── factory.js            # new Agent({ ... mcpServers })
    │   ├── runWithMcp.js         # run(agent, query)
    │   └── baseInstructions.js
    ├── mcp/
    │   ├── toolSets.js
    │   ├── mongodbServer.js
    │   └── context.js
    ├── seed/                     # not used by agents
    │   ├── connect.js
    │   ├── init.js
    │   ├── movie.schema.js
    │   └── movie.schema.json
    └── scripts/
        ├── initDb.js             # npm run db:init
        └── verify.js             # npm run verify
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
| Only `admin` / `local` in Atlas | Run `npm run db:init`, or ask the agent to write to `sample_mflix.movies` (MCP creates DB/collection on first write) |
| `[Tracing client error 401]` | Tracing should be off; ensure `OPENAI_AGENTS_DISABLE_TRACING=1` and restart |
| API returns 500 | Read `error` in JSON body; check Ollama logs and Atlas connectivity |
| Wrong operation routed | Rephrase with clearer verbs (e.g. "insert" vs "find"); see [How routing works](#how-routing-works) |

---

## License

MIT
