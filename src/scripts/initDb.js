import "../bootstrap.js";
import { ensureDatabase } from "../db/init.js";
import { disconnectDatabase } from "../db/connect.js";

const info = await ensureDatabase();
console.log("Database ready:", info);
await disconnectDatabase();
