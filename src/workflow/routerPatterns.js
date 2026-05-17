export const MONGO_CONTEXT_PATTERNS = [
  /\bsample_mflix\b/i,
  /\bmongo(db)?\b/i,
  /\batlas\b/i,
  /\b\.movies\b/i,
  /\b(collection|database|documents?)\b/i,
  /\binsert-many\b/i,
];

export const READ_PATTERNS = [
  /\b(find|get|fetch|read|list|show|search|query|count|aggregate|lookup|select)\b/i,
  /\bhow many\b/i,
  /\bwhat (is|are)\b/i,
];

export const CREATE_PATTERNS = [
  /\b(create|insert|add|seed|register|store new)\b/i,
];

export const UPDATE_PATTERNS = [
  /\b(update|modify|change|set|patch|edit|replace)\b/i,
  /\b\$set\b/,
];

export const DELETE_PATTERNS = [
  /\b(delete|remove|drop|purge|clear)\b/i,
];

export const WEB_PATTERNS = [
  /\b(search the web|web search|search online|search the internet|internet search)\b/i,
  /\b(duck\s*duck\s*go|duckduckgo)\b/i,
  /\bon the (web|internet)\b/i,
  /\b(latest news|current events|news about|today's news)\b/i,
  /\b(look up online|find online|google)\b/i,
  /\bwho is\b/i,
  /\bwhat happened\b/i,
];

export const OPERATION_PRIORITY = ["delete", "update", "create", "web", "read"];
