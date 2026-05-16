import { tool } from "@openai/agents";
import { z } from "zod";
import * as movieService from "../../services/movie.service.js";

const jsonFilter = z
  .record(z.string(), z.unknown())
  .describe('MongoDB query filter, e.g. { "title": "The Agent Demo" }');

const movieFields = {
  title: z.string(),
  year: z.number().int().nullable(),
  genres: z.array(z.string()).nullable(),
  plot: z.string().nullable(),
  rated: z.string().nullable(),
  runtime: z.number().int().nullable(),
};

function stringify(result) {
  return JSON.stringify(result, null, 2);
}

function stripNulls(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null),
  );
}

export const findMoviesTool = tool({
  name: "find_movies",
  description: "Find movies in the configured collection using a MongoDB filter.",
  parameters: z.object({
    filter: jsonFilter.default({}),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  execute: async ({ filter, limit }) =>
    stringify(await movieService.findMovies({ filter, limit })),
});

export const countMoviesTool = tool({
  name: "count_movies",
  description: "Count movies matching a MongoDB filter.",
  parameters: z.object({
    filter: jsonFilter.default({}),
  }),
  execute: async ({ filter }) => stringify(await movieService.countMovies(filter)),
});

export const getMovieByIdTool = tool({
  name: "get_movie_by_id",
  description: "Get a single movie by its MongoDB _id string.",
  parameters: z.object({
    id: z.string().describe("MongoDB ObjectId as a string"),
  }),
  execute: async ({ id }) => stringify(await movieService.getMovieById(id)),
});

export const createMovieTool = tool({
  name: "create_movie",
  description: "Insert one movie document. Database and collection are created automatically if missing.",
  parameters: z.object({
    ...movieFields,
    imdb: z
      .object({
        rating: z.number().nullable(),
        votes: z.number().int().nullable(),
      })
      .nullable(),
  }),
  execute: async (document) =>
    stringify(await movieService.createMovie(stripNulls(document))),
});

export const createMoviesTool = tool({
  name: "create_movies",
  description: "Insert multiple movie documents at once.",
  parameters: z.object({
    documents: z.array(z.object(movieFields)),
  }),
  execute: async ({ documents }) =>
    stringify(
      await movieService.createMovies(documents.map((doc) => stripNulls(doc))),
    ),
});

export const updateMoviesTool = tool({
  name: "update_movies",
  description: "Update all movies matching filter. Pass fields to change in update (applied as $set).",
  parameters: z.object({
    filter: jsonFilter,
    update: z.record(z.string(), z.unknown()),
  }),
  execute: async ({ filter, update }) =>
    stringify(await movieService.updateMovies(filter, update)),
});

export const deleteMoviesTool = tool({
  name: "delete_movies",
  description: "Delete all movies matching a MongoDB filter.",
  parameters: z.object({
    filter: jsonFilter,
  }),
  execute: async ({ filter }) => stringify(await movieService.deleteMovies(filter)),
});

export const readTools = [findMoviesTool, countMoviesTool, getMovieByIdTool];
export const createTools = [createMovieTool, createMoviesTool];
export const updateTools = [updateMoviesTool];
export const deleteTools = [deleteMoviesTool];
