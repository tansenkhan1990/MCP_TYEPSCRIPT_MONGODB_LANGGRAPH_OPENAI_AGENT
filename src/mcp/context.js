import { env } from "../config/env.js";

export function getCollectionContext() {
  return `${env.mongoDbName}.${env.mongoCollection}`;
}

export function getMongoContextHint() {
  const parts = [];
  if (env.mongoDbName) parts.push(`default database: "${env.mongoDbName}"`);
  if (env.mongoCollection) parts.push(`default collection: "${env.mongoCollection}"`);
  return parts.length
    ? parts.join(", ")
    : "use list-databases and list-collections when database or collection is not specified";
}
