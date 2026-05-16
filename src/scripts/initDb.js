import "../bootstrap.js";
import { ensureDatabase } from "../seed/init.js";
import { disconnectDatabase } from "../seed/connect.js";

const info = await ensureDatabase();
console.log("Database ready:", info);
await disconnectDatabase();
