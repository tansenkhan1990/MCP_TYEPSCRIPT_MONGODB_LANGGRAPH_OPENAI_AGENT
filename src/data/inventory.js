import { env } from "../config/env.js";
import { INTERNAL_DATA_SOURCES } from "../constants/dataSources.js";
import { VECTORLESS_RAG_COLLECTION } from "../constants/rag.js";
import { escapeRegex } from "../lib/escapeRegex.js";
import { requireNonEmptyQuestion, toHandlerResult } from "../lib/handlerResult.js";
import { connectDatabase } from "../seed/connect.js";
import { getRagModel } from "../rag/db.js";

const MOVIE_SEARCH_FIELDS = ["title", "plot", "genres", "directors", "cast", "fullplot", "countries"];

export function extractInventorySubject(query) {
  const match = query.trim().match(/\b(?:about|on|regarding|for)\s+["']?([A-Za-z0-9][\w.-]{1,50})["']?/i);
  return match?.[1]?.trim() ?? null;
}

async function listRagDocuments() {
  const Model = await getRagModel();
  return Model.find({})
    .sort({ createdAt: -1 })
    .select({
      fileName: 1,
      description: 1,
      pageCount: 1,
      chunkCount: 1,
      createdAt: 1,
    })
    .lean();
}

async function searchRagForSubject(subject) {
  const Model = await getRagModel();
  const regex = new RegExp(escapeRegex(subject), "i");

  const docs = await Model.find({
    $or: [
      { fileName: regex },
      { description: regex },
      { fullText: regex },
      { "chunks.text": regex },
    ],
  })
    .select({ fileName: 1, description: 1, chunks: 1 })
    .limit(10)
    .lean();

  return docs.map((doc) => {
    const matchingChunks = (doc.chunks ?? []).filter((chunk) => regex.test(chunk.text ?? ""));
    return {
      fileName: doc.fileName,
      description: doc.description,
      mentionCount: matchingChunks.length,
      sampleExcerpt: matchingChunks[0]?.text?.slice(0, 280)?.trim() ?? null,
    };
  });
}

async function searchMoviesForSubject(subject) {
  const connection = await connectDatabase();
  const collection = connection.collection(env.mongoCollection);
  const regex = new RegExp(escapeRegex(subject), "i");
  const filter = { $or: MOVIE_SEARCH_FIELDS.map((field) => ({ [field]: regex })) };

  const [samples, total] = await Promise.all([
    collection.find(filter).project({ title: 1, year: 1, genres: 1, plot: 1 }).limit(5).toArray(),
    collection.countDocuments(filter),
  ]);

  return { total, samples };
}

async function buildMovieReport(subject) {
  if (!subject) {
    return null;
  }

  try {
    const hits = await searchMoviesForSubject(subject);
    return {
      collection: env.mongoCollection,
      matchCount: hits.total,
      samples: hits.samples.map((movie) => ({
        title: movie.title,
        year: movie.year,
        genres: movie.genres,
        plot: movie.plot?.slice(0, 200),
      })),
    };
  } catch {
    return {
      collection: env.mongoCollection,
      matchCount: 0,
      samples: [],
      unavailable: true,
    };
  }
}

async function buildInternalDataReport(subject) {
  const [ragDocs, ragHits, movies] = await Promise.all([
    listRagDocuments(),
    subject ? searchRagForSubject(subject) : Promise.resolve([]),
    buildMovieReport(subject),
  ]);

  return {
    subject,
    sources: INTERNAL_DATA_SOURCES.map((source) => ({
      id: source.id,
      label: source.label,
      database: source.database(),
      collection: source.collection(),
      description: source.description,
    })),
    rag: {
      collection: VECTORLESS_RAG_COLLECTION,
      totalDocuments: ragDocs.length,
      documents: ragDocs.map((doc) => ({
        fileName: doc.fileName,
        description: doc.description,
        pageCount: doc.pageCount,
        chunkCount: doc.chunkCount,
        uploadedAt: doc.createdAt,
      })),
      subjectMatches: ragHits,
    },
    movies,
  };
}

function formatCatalogReport(report) {
  const lines = ["Internal / company data available in this system:", ""];

  for (const source of report.sources) {
    lines.push(
      `- ${source.label}: ${source.database}.${source.collection} — ${source.description}`,
    );
  }

  lines.push(
    "",
    `Uploaded PDFs (${report.rag.collection}): ${report.rag.totalDocuments} document(s)`,
  );

  if (report.rag.documents.length === 0) {
    lines.push("  (none — upload via POST /api/upload-pdf)");
  } else {
    for (const doc of report.rag.documents) {
      lines.push(`  • ${doc.fileName} — ${doc.description} (${doc.chunkCount} chunks)`);
    }
  }

  lines.push(
    "",
    `Movie catalog (${env.mongoCollection}): use a read query for full search.`,
    "",
    'For PDF content, ask: "What does the research paper say about …?"',
  );

  return lines.join("\n");
}

function formatSubjectReport(report) {
  const { subject } = report;
  const lines = [`What we have about "${subject}":`, "", `PDFs (${report.rag.collection}):`];

  if (report.rag.subjectMatches.length === 0) {
    lines.push(`  No uploaded PDF mentions "${subject}".`);
    lines.push(`  (${report.rag.totalDocuments} PDF(s) on file total.)`);
  } else {
    for (const hit of report.rag.subjectMatches) {
      lines.push(`  • ${hit.fileName} — ${hit.description}`);
      lines.push(`    ~${hit.mentionCount} matching chunk(s)`);
      if (hit.sampleExcerpt) {
        lines.push(`    Excerpt: "${hit.sampleExcerpt}…"`);
      }
    }
  }

  lines.push("");
  lines.push(`Movie catalog (${report.movies?.collection ?? env.mongoCollection}):`);

  if (!report.movies) {
    lines.push("  (not searched)");
  } else if (report.movies.unavailable) {
    lines.push("  Movie catalog search is temporarily unavailable.");
  } else if (report.movies.matchCount === 0) {
    lines.push(`  No movie records matched "${subject}".`);
  } else {
    lines.push(`  ${report.movies.matchCount} matching record(s). Examples:`);
    for (const movie of report.movies.samples) {
      const year = movie.year ? ` (${movie.year})` : "";
      lines.push(`  • ${movie.title ?? "Untitled"}${year}`);
      if (movie.plot) {
        lines.push(`    ${movie.plot}…`);
      }
    }
  }

  lines.push("", `For deeper PDF answers: "What does the uploaded PDF say about ${subject}?"`);
  return lines.join("\n");
}

export function queryInventory(userQuery) {
  return toHandlerResult(async () => {
    const check = requireNonEmptyQuestion(userQuery);
    if (check.error) {
      return check;
    }

    const subject = extractInventorySubject(check.question);
    const report = await buildInternalDataReport(subject);
    const result = subject ? formatSubjectReport(report) : formatCatalogReport(report);

    return { result, error: null };
  });
}
