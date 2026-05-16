import { connectDatabase } from "./connect.js";
import { getMovieModel } from "../schemas/movie.schema.js";
import { env } from "../config/env.js";

const SEED_MOVIES = [
  {
    title: "The Agent Demo",
    year: 2026,
    genres: ["Sci-Fi", "Drama"],
    plot: "A developer tests LangGraph agents against MongoDB Atlas.",
    rated: "PG",
    runtime: 120,
    imdb: { rating: 8.1, votes: 100 },
  },
  {
    title: "MongoDB Nights",
    year: 2010,
    genres: ["Documentary"],
    plot: "Behind the scenes of document databases.",
    rated: "G",
    runtime: 95,
    imdb: { rating: 7.5, votes: 250 },
  },
];

let initialized = false;

/**
 * Connects to Atlas, ensures the collection exists, and seeds sample movies when empty.
 */
export async function ensureDatabase() {
  const connection = await connectDatabase();
  const db = connection.db;
  const collections = await db
    .listCollections({ name: env.mongoCollection })
    .toArray();

  if (collections.length === 0) {
    await db.createCollection(env.mongoCollection);
  }

  const Movie = getMovieModel();
  await Movie.createIndexes();

  const count = await Movie.countDocuments();
  if (count === 0) {
    await Movie.insertMany(SEED_MOVIES);
  }

  initialized = true;
  return {
    database: env.mongoDbName,
    collection: env.mongoCollection,
    documentCount: await Movie.countDocuments(),
    seeded: count === 0,
  };
}

export function isDatabaseInitialized() {
  return initialized;
}
