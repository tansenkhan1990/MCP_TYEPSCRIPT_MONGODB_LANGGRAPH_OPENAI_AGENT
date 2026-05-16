import mongoose from "mongoose";
import { env } from "../config/env.js";

const imdbSchema = new mongoose.Schema(
  {
    rating: { type: Number },
    votes: { type: Number },
  },
  { _id: false },
);

export const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    year: { type: Number },
    genres: [{ type: String, trim: true }],
    plot: { type: String },
    rated: { type: String },
    runtime: { type: Number },
    imdb: imdbSchema,
  },
  {
    timestamps: true,
    collection: env.mongoCollection,
  },
);

movieSchema.index({ title: 1 });
movieSchema.index({ year: 1 });

/**
 * @returns {mongoose.Model} Movie model bound to MONGO_DB_NAME / MONGO_COLLECTION from .env
 */
export function getMovieModel() {
  if (mongoose.models.Movie) {
    return mongoose.models.Movie;
  }
  return mongoose.model("Movie", movieSchema, env.mongoCollection);
}
