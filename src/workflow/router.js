import { scorePatterns } from "../lib/scorePatterns.js";
import {
  CREATE_PATTERNS,
  DELETE_PATTERNS,
  INVENTORY_PATTERNS,
  MONGO_CONTEXT_PATTERNS,
  OPERATION_PRIORITY,
  RAG_PATTERNS,
  READ_PATTERNS,
  UPDATE_PATTERNS,
  WEB_PATTERNS,
} from "./routerPatterns.js";

const PATTERN_GROUPS = {
  read: READ_PATTERNS,
  create: CREATE_PATTERNS,
  update: UPDATE_PATTERNS,
  delete: DELETE_PATTERNS,
  inventory: INVENTORY_PATTERNS,
  rag: RAG_PATTERNS,
  web: WEB_PATTERNS,
};

function hasMongoContext(text) {
  return MONGO_CONTEXT_PATTERNS.some((pattern) => pattern.test(text));
}

function isRagContentQuestion(text) {
  return (
    /\b(what does|summarize|according to|from the)\b/i.test(text) &&
    /\b(pdf|paper|document|upload)\b/i.test(text)
  );
}

function scoreAll(text) {
  return Object.fromEntries(
    Object.entries(PATTERN_GROUPS).map(([op, patterns]) => [
      op,
      scorePatterns(text, patterns),
    ]),
  );
}

export function classifyOperation(userQuery) {
  const text = userQuery.trim();
  if (!text) return "read";

  const scores = scoreAll(text);
  const mongoCtx = hasMongoContext(text);

  if (scores.inventory > 0 && !mongoCtx && !isRagContentQuestion(text)) {
    return "inventory";
  }
  if (scores.rag > 0 && !mongoCtx) {
    return "rag";
  }
  if (scores.web > 0 && !mongoCtx) {
    return "web";
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "read";

  const winners = Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([op]) => op);

  if (winners.length === 1) return winners[0];

  return OPERATION_PRIORITY.find((op) => winners.includes(op)) ?? "read";
}
