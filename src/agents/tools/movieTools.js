import { tool } from "@openai/agents";
import { z } from "zod";
import * as movieService from "../../services/movie.service.js";

const jsonFilter = z
  .record(z.string(), z.unknown())
  .describe("MongoDB query filter object, e.g. { \"title\": \"The Agent Demo\" }");

function stringify(result) {
  return JSON.stringify(result, null, 2);
}

export const findMoviesTool = tool({
  name: "find_movies",
  description: "Find movies in the configured collection using a MongoDB filter.",
  parameters: z.object({
    filter: jsonFilter.optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  execute: async ({ filter, limit }) =>
    stringify(await movieService.findMovies({ filter: filter ?? {}, limit: limit ?? 10 })),
});

export const countMoviesTool = tool({
  name: "count_movies",
  description: "Count movies matching a MongoDB filter.",
  parameters: z.object({
    filter: jsonFilter.optional(),
  }),
  execute: async ({ filter }) =>
    stringify(await movieService.countMovies(filter ?? {})),
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
    title: z.string(),
    year: z.number().int().optional(),
    genres: z.array(z.string()).optional(),
    plot: z.string().optional(),
    rated: z.string().optional(),
    runtime: z.number().int().optional(),
    imdb: z
      .object({
        rating: z.number().optional(),
        votes: z.number().int().optional(),
      })
      .optional(),
  }),
  execute: async (document) => stringify(await movieService.createMovie(document)),
});

export const createMoviesTool = tool({
  name: "create_movies",
  description: "Insert multiple movie documents at once.",
  parameters: z.object({
    documents: z.array(
      z.object({
        title: z.string(),
        year: z.number().int().optional(),
        genres: z.array(z.string()).optional(),
        plot: z.string().optional(),
        rated: z.string().optional(),
        runtime: z.number().int().optional(),
      }),
    ),
  }),
  execute: async ({ documents }) => stringify(await movieService.createMovies(documents)),
});

export const updateMoviesTool = tool({
  name: "update_movies",
  description: "Update all movies matching filter. Pass fields to change in `update` (applied as $set).",
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
