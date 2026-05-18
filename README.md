# MongoDB Atlas Agents + PDF RAG

Multi-agent system for natural-language **Create, Read, Update, and Delete** on **MongoDB Atlas**, plus **company PDF RAG** (keyword / full-text) and **internal data discovery**. **LangGraph** routes each request; **OpenAI Agents SDK** runs specialists where needed; the official **MongoDB MCP Server** performs agent CRUD. Optional `npm run db:init` seeds demo movies with Mongoose (agents never use Mongoose for CRUD).

Use the **CLI** or **Express REST API** — one endpoint (`POST /api/query`) for movies, web search, PDF Q&A, and “what data do we have about X?”.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [How routing works](#how-routing-works)
- [PDF RAG (vectorless)](#pdf-rag-vectorless)
- [Internal data inventory](#internal-data-inventory)
- [MongoDB MCP integration](#mongodb-mcp-integration)
- [Agents](#agents)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the project](#running-the-project)
- [CLI usage](#cli-usage)
- [REST API](#rest-api)
- [Example prompts](#example-prompts)
- [Project structure](#project-structure)
- [npm scripts](#npm-scripts)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Seven routed operations** — MongoDB CRUD (`read` / `create` / `update` / `delete`), **RAG** (uploaded PDFs), **inventory** (discover internal/company data), **web** (DuckDuckGo)
- **LangGraph workflow** — keyword routing (no extra LLM call to classify)
- **MongoDB MCP CRUD** — `find`, `insert-many`, `update-many`, `delete-many` via official MCP server
- **PDF upload** — `POST /api/upload-pdf` → chunks stored in `vectorless_rag`
- **RAG Q&A** — ask about PDF content via `POST /api/query`
- **Data inventory** — “what company data do we have about KG?” searches PDFs + movie catalog
- **Least-privilege MCP tools** — per-operation allowlists
- **Ollama or OpenAI** — any OpenAI-compatible Chat Completions API
- **CLI and HTTP API** — interactive terminal or REST
- **Tracing disabled by default** — safe for local models

---

## Tech stack

| Layer | Package / service |
|-------|-------------------|
| Workflow | [@langchain/langgraph](https://www.npmjs.com/package/@langchain/langgraph) |
| Agents | [@openai/agents](https://www.npmjs.com/package/@openai/agents) |
| Database (agents) | [mongodb-mcp-server](https://www.npmjs.com/package/mongodb-mcp-server) |
| RAG storage | Mongoose → `vectorless_rag` (full-text index) |
| PDF parsing | [pdf-parse](https://www.npmjs.com/package/pdf-parse) |
| Optional seed | Mongoose (`npm run db:init`) |
| HTTP API | [Express](https://expressjs.com/) 5.x |
| LLM | Ollama (default) or OpenAI API |
| Runtime | Node.js 20.19+ (ES modules) |

---

## Architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    CLI[CLI - npm start]
    API[Express - npm run api]
  end

  subgraph workflow [LangGraph]
    Route[route]
    Exec[execute_agent]
    Route --> Exec
  end

  subgraph handlers [Handlers]
    MCP[MongoDB MCP agents]
    RAG[queryRag - PDF excerpts + LLM]
    Inv[queryInventory - catalog search]
    Web[DuckDuckGo agent]
  end

  subgraph data [Data]
    Movies[(sample_mflix.movies)]
    PDFs[(vectorless_rag)]
    Atlas[(MongoDB Atlas)]
  end

  CLI --> executeQuery
  API --> executeQuery
  API --> uploadPdf[POST /api/upload-pdf]
  uploadPdf --> PDFs
  executeQuery --> Route
  Route --> Exec
  Exec --> MCP
  Exec --> RAG
  Exec --> Inv
  Exec --> Web
  MCP --> Atlas
  RAG --> PDFs
  Inv --> PDFs
  Inv --> Movies
```

**Flow**

1. Client calls `executeQuery(question)` (CLI or `POST /api/query`).
2. LangGraph **route** classifies: `read` | `create` | `update` | `delete` | `rag` | `inventory` | `web`.
3. **execute_agent** runs the matching handler from `src/agents/dispatch.js`.
4. Response includes `operation`, `result`, `dataLayer`, and `database` / `collection` when relevant.

---

## How routing works

Keyword scoring in `src/workflow/router.js` (see `src/workflow/routerPatterns.js`). No extra LLM call for routing.

| Operation | Purpose | Example keywords |
|-----------|---------|------------------|
| **read** | MongoDB read via MCP | find, get, list, show, count, aggregate |
| **create** | MongoDB insert via MCP | create, insert, add, seed |
| **update** | MongoDB update via MCP | update, modify, set, patch |
| **delete** | MongoDB delete via MCP | delete, remove, drop |
| **rag** | Answer from uploaded PDFs | research paper, uploaded PDF, what does the document say, summarize my PDF |
| **inventory** | What internal data exists | what company data, what do we have about, list our documents, internal data |
| **web** | DuckDuckGo (no Mongo context) | search the web, latest news, duckduckgo |

**Rules**

- Highest pattern score wins; default **read** if nothing matches.
- Tie-break priority: `delete` → `update` → `create` → `web` → `inventory` → `rag` → `read`.
- **MongoDB context** (`sample_mflix`, `movies`, `collection`, …) keeps CRUD even if “online” appears.
- **Inventory vs RAG:** “what do we have about KG?” → **inventory**; “what does the research paper say about KG?” → **rag**.

Responses include `"operation"` so you can see the route.

---

## PDF RAG (vectorless)

1. **Upload** a PDF (multipart form, field name `file`):

```bash
curl -X POST http://localhost:3000/api/upload-pdf \
  -F "file=@research_paper.pdf"
```

Optional form field: `description` (label stored with the document).

2. **Ask** via the same query API:

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What does the research paper say about the main findings?"}'
```

Documents are stored in **`vectorless_rag`** with a MongoDB text index on `fullText` and `chunks.text`. The RAG handler retrieves relevant chunks and answers with your configured LLM.

---

## Internal data inventory

Discover what is on file before diving into a specific PDF or collection:

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What company data do we have about KG?"}'
```

| Question type | Example |
|---------------|---------|
| Full catalog | `What internal data do we have?` |
| Topic search | `What do we have about KG?` |
| PDF content | `What does the uploaded PDF say about KG?` → routes to **rag** |

Inventory searches:

- **`vectorless_rag`** — uploaded PDFs (filename, description, text)
- **`movies`** (from `.env`) — title, plot, genres, etc.

---

## MongoDB MCP integration

| File | Purpose |
|------|---------|
| `src/mcp/mongodbServer.js` | `MCPServerStdio` per operation |
| `src/mcp/toolSets.js` | Tool allowlists |
| `src/mcp/context.js` | Default DB/collection in prompts |

| Agent | MCP tools (summary) |
|-------|---------------------|
| **read** | find, aggregate, count, list-databases, list-collections, … |
| **create** | insert-many, create-collection, create-index |
| **update** | update-many, rename-collection |
| **delete** | delete-many, drop-collection, drop-index |

---

## Agents

| Operation | Handler | `dataLayer` |
|-----------|---------|-------------|
| read / create / update / delete | OpenAI Agent + MCP | `mcp` |
| rag | `src/rag/queryRag.js` | `vectorless_rag` |
| inventory | `src/data/inventory.js` | `internal_catalog` |
| web | DuckDuckGo tool agent | `duckduckgo` |

MongoDB specialists: `src/agents/definitions.js`, `factory.js`, `dispatch.js`, `runAgent.js`.

---

## Prerequisites

1. **Node.js** 20.19.0+
2. **MongoDB Atlas** connection string
3. **LLM** — Ollama or OpenAI-compatible API

```bash
ollama serve
ollama pull <model matching LOCAL_MODEL_NAME>
```

Allow your IP in [Atlas Network Access](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

---

## Installation

```bash
git clone https://github.com/tansenkhan1990/MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT.git
cd MCP_TYEPSCRIPT_MONGODB_LANGGRAPH_OPENAI_AGENT

npm install
cp .env.example .env
```

Edit `.env` with Atlas URI, model name, and defaults.

---

## Configuration

### Required

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | `ollama` for Ollama, or your OpenAI key |
| `MONGO_DB_CONNECTION_STRING` | Atlas URI |

### Recommended

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_BASE_URL` | OpenAI API | `http://localhost:11434/v1` for Ollama |
| `LOCAL_MODEL_NAME` | `gpt-4o-mini` | Chat model for agents + RAG answers |
| `MONGO_DB_NAME` | `sample_mflix` | Database name |
| `MONGO_COLLECTION` | `movies` | Default MCP collection |
| `PORT` | `3000` | API port |

### PDF / RAG

| Variable | Default | Description |
|----------|---------|-------------|
| `PDF_MAX_UPLOAD_MB` | `15` | Max upload size |
| `RAG_CHUNK_SIZE` | `1000` | Characters per chunk |
| `RAG_CHUNK_OVERLAP` | `150` | Overlap between chunks |

### Example `.env` (Ollama + Atlas)

```env
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
OPENAI_AGENTS_DISABLE_TRACING=1
LOCAL_MODEL_NAME=llama3.2
MONGO_DB_CONNECTION_STRING=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/
MONGO_DB_NAME=sample_mflix
MONGO_COLLECTION=movies
PORT=3000
PDF_MAX_UPLOAD_MB=15
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=150
```

Never commit `.env`.

---

## Running the project

| Command | Description |
|---------|-------------|
| `npm run db:init` | Seed demo movies (optional) |
| `npm run api` | Start API |
| `npm run api:dev` | API with `--watch` |
| `npm start` | CLI (interactive) |
| `npm start -- "question"` | CLI one-shot |
| `npm run verify` | Local router smoke test (no Atlas) |

First MCP request often takes **15–30+ seconds** (MCP spawn + Atlas + LLM).

---

## CLI usage

```bash
npm start -- "Find 5 movies in sample_mflix.movies where year > 2010"
```

```bash
npm start
# You> What company data do we have about KG?
# You> exit
```

---

## REST API

Base URL: `http://localhost:3000` (or `PORT`).

### `GET /health`

```json
{
  "status": "ok",
  "model": "llama3.2",
  "database": "sample_mflix",
  "collection": "movies",
  "operations": ["read", "create", "update", "delete", "rag", "inventory", "web"],
  "ragCollection": "vectorless_rag",
  "uploadEndpoint": "POST /api/upload-pdf",
  "queryExamples": {
    "inventory": "What company data do we have about KG?",
    "rag": "What does the research paper say about the main findings?",
    "movies": "Find comedy movies in sample_mflix.movies"
  }
}
```

### `POST /api/upload-pdf`

Upload a company PDF into `vectorless_rag`.

**Body:** `multipart/form-data`

| Field | Required | Description |
|-------|----------|-------------|
| `file` | Yes | PDF file (`file`, `pdf`, or `document`) |
| `description` | No | Human-readable label |

```bash
curl -X POST http://localhost:3000/api/upload-pdf \
  -F "file=@research_paper.pdf" \
  -F "description=KG annual report"
```

**Success `201`**

```json
{
  "documentId": "...",
  "collection": "vectorless_rag",
  "database": "sample_mflix",
  "fileName": "research_paper.pdf",
  "description": "KG annual report",
  "chunkCount": 59,
  "pageCount": 17
}
```

### `POST /api/query`

Natural-language request; LangGraph picks the handler.

**Body**

```json
{ "question": "your message" }
```

Also accepts `"query"` instead of `"question"`.

**Success `200` (movies / MCP)**

```json
{
  "operation": "read",
  "result": "...",
  "database": "sample_mflix",
  "collection": "movies",
  "dataLayer": "mcp"
}
```

**Success `200` (RAG)**

```json
{
  "operation": "rag",
  "result": "... answer ...\n\nSources: research_paper.pdf",
  "database": "sample_mflix",
  "collection": "vectorless_rag",
  "dataLayer": "vectorless_rag"
}
```

**Success `200` (inventory)**

```json
{
  "operation": "inventory",
  "result": "What we have about \"KG\":\n\nPDFs (vectorless_rag):\n  • ...",
  "dataLayer": "internal_catalog"
}
```

**Error `500`**

```json
{
  "operation": "rag",
  "result": null,
  "error": "Error message",
  "dataLayer": "vectorless_rag"
}
```

### cURL quick reference

```bash
# Health
curl http://localhost:3000/health

# Upload PDF
curl -X POST http://localhost:3000/api/upload-pdf -F "file=@doc.pdf"

# Movies (MCP)
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Find 3 movies in sample_mflix.movies"}'

# Inventory
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What company data do we have about KG?"}'

# RAG
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Summarize my uploaded PDF"}'

# Web
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Search the web for latest Node.js LTS news"}'
```

---

## Example prompts

### MongoDB (include `sample_mflix.movies` when possible)

| Operation | Example |
|-----------|---------|
| Read | `Find 5 movies in sample_mflix.movies where year > 2010` |
| Create | `Insert a movie with title Agent Demo and year 2026 into sample_mflix.movies` |
| Update | `Set year to 2027 for movies titled Agent Demo in sample_mflix.movies` |
| Delete | `Delete movies with title Agent Demo from sample_mflix.movies` |

### Company PDFs & internal data

| Goal | Example question |
|------|------------------|
| List all sources | `What internal data do we have?` |
| Topic inventory | `What company data do we have about KG?` |
| PDF Q&A | `What does the research paper say about revenue?` |
| PDF summary | `Summarize my uploaded PDF` |

### Web

| Example |
|---------|
| `Search the web for the latest Node.js LTS release notes` |
| `Who is the CEO of MongoDB? Use duckduckgo` |

---

## Project structure

```
src/
├── bootstrap.js
├── index.js                 # CLI
├── server.js                # API listen
├── constants/
│   ├── operations.js        # read | create | update | delete | rag | inventory | web
│   ├── rag.js
│   └── dataSources.js       # internal source registry
├── config/                  # env, agents SDK, tracing
├── lib/                     # errors, routing helpers, LLM chat, RAG chunks, …
├── cli/
├── http/
│   ├── app.js               # /health, /api/query
│   ├── uploadPdfRoute.js    # /api/upload-pdf
│   └── …
├── workflow/                # LangGraph router, graph, executeQuery
├── agents/                  # MCP + web agents, dispatch
├── data/
│   └── inventory.js         # internal data discovery
├── rag/
│   ├── uploadPdf.js
│   ├── queryRag.js
│   ├── db.js
│   └── schemas/
├── mcp/
├── seed/                    # optional db:init only
└── scripts/
    ├── initDb.js
    └── verify.js
```

Shared entry: `src/workflow/executeQuery.js` (CLI + API).

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm start` | CLI |
| `npm run dev` | CLI with `--watch` |
| `npm run api` | Express API |
| `npm run api:dev` | API with `--watch` |
| `npm run db:init` | Seed movies collection |
| `npm run verify` | Router smoke test (offline) |

---

## Security

- Do not commit `.env` or expose Atlas credentials.
- Use least-privilege Atlas users in production.
- Delete/drop MCP tools are available to the delete agent.
- **No API authentication** — add auth, rate limits, and HTTPS before public exposure.
- Uploaded PDFs are stored in MongoDB; restrict access to `vectorless_rag`.

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| `Connection refused` on 11434 | `ollama serve` |
| Model not found | `ollama pull <LOCAL_MODEL_NAME>` |
| Atlas connection failed | URI, IP allowlist, user permissions |
| Upload returns 400 | Use **form-data**, field `file`, not raw JSON |
| RAG always empty | Upload PDF first; check `vectorless_rag` in Atlas |
| Inventory error on movies | Ensure Atlas reachable; movie search uses Mongoose driver |
| Wrong operation | Rephrase; see [How routing works](#how-routing-works) |
| `[Tracing client error 401]` | `OPENAI_AGENTS_DISABLE_TRACING=1`, restart API |
| API 500 | Read `error` in JSON; check Ollama + Atlas |

---

## License

MIT
