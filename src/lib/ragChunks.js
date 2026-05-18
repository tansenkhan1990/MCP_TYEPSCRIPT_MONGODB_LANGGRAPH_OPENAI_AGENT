export function rankChunksByQuery(chunks, query, limit = 6) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  if (terms.length === 0) {
    return chunks.slice(0, limit);
  }

  return [...chunks]
    .map((chunk) => {
      const lower = chunk.text.toLowerCase();
      const score = terms.reduce(
        (sum, term) => sum + (lower.split(term).length - 1),
        0,
      );
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk }) => chunk);
}
