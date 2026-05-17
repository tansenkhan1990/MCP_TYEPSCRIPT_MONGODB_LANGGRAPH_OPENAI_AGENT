import { OPERATIONS } from "../constants/operations.js";
import {
  CREATE_PATTERNS,
  DELETE_PATTERNS,
  MONGO_CONTEXT_PATTERNS,
  OPERATION_PRIORITY,
  READ_PATTERNS,
  UPDATE_PATTERNS,
  WEB_PATTERNS,
} from "./routerPatterns.js";

export { OPERATIONS };

function scorePatterns(text, patterns) {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function hasMongoContext(text) {
  return MONGO_CONTEXT_PATTERNS.some((pattern) => pattern.test(text));
}

export function classifyOperation(userQuery) {
  const text = userQuery.trim();
  if (!text) return "read";

  const webScore = scorePatterns(text, WEB_PATTERNS);
  if (webScore > 0 && !hasMongoContext(text)) {
    return "web";
  }

  const scores = {
    read: scorePatterns(text, READ_PATTERNS),
    create: scorePatterns(text, CREATE_PATTERNS),
    update: scorePatterns(text, UPDATE_PATTERNS),
    delete: scorePatterns(text, DELETE_PATTERNS),
    web: webScore,
  };

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "read";

  const winners = Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([op]) => op);

  if (winners.length === 1) return winners[0];

  return OPERATION_PRIORITY.find((op) => winners.includes(op)) ?? "read";
}
