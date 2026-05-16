const READ_PATTERNS = [
  /\b(find|get|fetch|read|list|show|search|query|count|aggregate|lookup|select)\b/i,
  /\bhow many\b/i,
  /\bwhat (is|are)\b/i,
];

const CREATE_PATTERNS = [
  /\b(create|insert|add|seed|register|store new)\b/i,
];

const UPDATE_PATTERNS = [
  /\b(update|modify|change|set|patch|edit|replace)\b/i,
  /\b\$set\b/,
];

const DELETE_PATTERNS = [
  /\b(delete|remove|drop|purge|clear)\b/i,
];

export function classifyOperation(userQuery) {
  const text = userQuery.trim();
  if (!text) return "read";

  const scores = {
    read: scorePatterns(text, READ_PATTERNS),
    create: scorePatterns(text, CREATE_PATTERNS),
    update: scorePatterns(text, UPDATE_PATTERNS),
    delete: scorePatterns(text, DELETE_PATTERNS),
  };

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "read";

  const winners = Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([op]) => op);

  if (winners.length === 1) return winners[0];

  const priority = ["delete", "update", "create", "read"];
  return priority.find((op) => winners.includes(op)) ?? "read";
}

function scorePatterns(text, patterns) {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

export const OPERATIONS = ["read", "create", "update", "delete"];
