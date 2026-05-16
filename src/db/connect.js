import mongoose from "mongoose";
import { env } from "../config/env.js";

let connected = false;

export async function connectDatabase() {
  if (connected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoConnectionString, {
    dbName: env.mongoDbName,
    serverSelectionTimeoutMS: 30_000,
  });

  connected = true;
  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  connected = false;
}
