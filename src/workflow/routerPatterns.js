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

export const INVENTORY_PATTERNS = [
  /\bwhat\s+(internal|company)\s+data\b/i,
  /\bwhich\s+(data|documents?|files?|sources?)\s+(do\s+)?we have\b/i,
  /\bwhat\s+do we have\s+(about|on)\b/i,
  /\bwhat\s+information\s+(do\s+)?we have\s+(about|on)\b/i,
  /\blist\s+(our|internal|company)\s+(data|documents?|sources?)\b/i,
  /\bdo we have\s+(any\s+)?(data|information)\s+(about|on)\b/i,
  /\bwhat\s+(data|documents?)\s+(are|is)\s+available\b/i,
  /\bwhat\s+company\s+data\b/i,
];

export const RAG_PATTERNS = [
  /\bvectorless_rag\b/i,
  /\b(uploaded|my)\s+(pdf|document|paper|file)s?\b/i,
  /\b(from|in)\s+the\s+(uploaded\s+)?(pdf|document|paper)\b/i,
  /\baccording to\s+(the\s+)?(pdf|document|paper|upload)\b/i,
  /\b(the\s+)?research\s+paper\b/i,
  /\bwhat does\b.*\b(pdf|document|paper)\b/i,
  /\bwhat (did|does)\b.*\bsay\b/i,
  /\bsummarize\b.*\b(pdf|document|paper|upload)\b/i,
  /\bfrom\s+rag\b/i,
  /\buploaded\s+pdf\b/i,
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

export const OPERATION_PRIORITY = [
  "delete",
  "update",
  "create",
  "web",
  "inventory",
  "rag",
  "read",
];
