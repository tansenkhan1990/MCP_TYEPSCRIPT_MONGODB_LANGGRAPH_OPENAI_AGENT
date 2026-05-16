import mongoose from "mongoose";
import { getMovieModel } from "../schemas/movie.schema.js";
import { env } from "../config/env.js";

function parseObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid document id: ${id}`);
  }
  return new mongoose.Types.ObjectId(id);
}

export function getCollectionContext() {
  return `${env.mongoDbName}.${env.mongoCollection}`;
}

export async function findMovies({ filter = {}, limit = 10, sort = { year: -1 } } = {}) {
  const Movie = getMovieModel();
  const docs = await Movie.find(filter).sort(sort).limit(Math.min(limit, 100)).lean();
  return { collection: getCollectionContext(), count: docs.length, documents: docs };
}

export async function countMovies(filter = {}) {
  const Movie = getMovieModel();
  const count = await Movie.countDocuments(filter);
  return { collection: getCollectionContext(), count };
}

export async function getMovieById(id) {
  const Movie = getMovieModel();
  const doc = await Movie.findById(parseObjectId(id)).lean();
  if (!doc) {
    throw new Error(`No movie found with id ${id}`);
  }
  return { collection: getCollectionContext(), document: doc };
}

export async function createMovie(document) {
  const Movie = getMovieModel();
  const created = await Movie.create(document);
  return {
    collection: getCollectionContext(),
    insertedId: created._id.toString(),
    document: created.toObject(),
  };
}

export async function createMovies(documents) {
  const Movie = getMovieModel();
  const created = await Movie.insertMany(documents);
  return {
    collection: getCollectionContext(),
    insertedCount: created.length,
    insertedIds: created.map((d) => d._id.toString()),
  };
}

export async function updateMovies(filter, update) {
  const Movie = getMovieModel();
  const payload = update.$set ? update : { $set: update };
  const result = await Movie.updateMany(filter, payload);
  return {
    collection: getCollectionContext(),
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
}

export async function deleteMovies(filter) {
  const Movie = getMovieModel();
  const result = await Movie.deleteMany(filter);
  return {
    collection: getCollectionContext(),
    deletedCount: result.deletedCount,
  };
}
