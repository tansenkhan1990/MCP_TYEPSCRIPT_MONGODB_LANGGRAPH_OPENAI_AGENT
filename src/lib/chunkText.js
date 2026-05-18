/**
 * Splits text into overlapping chunks for RAG storage.
 */
export function chunkText(text, chunkSize, overlap) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  if (normalized.length <= chunkSize) {
    return [{ index: 0, text: normalized }];
  }

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const slice = normalized.slice(start, end).trim();
    if (slice) {
      chunks.push({ index, text: slice });
      index += 1;
    }
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
