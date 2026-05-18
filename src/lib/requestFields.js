export function normalizeBody(body) {
  if (!body || typeof body !== "object") {
    return {};
  }

  const normalized = {};
  for (const [key, value] of Object.entries(body)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

export function pickField(sources, keys) {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key] ?? source[key.toLowerCase()];
      if (value != null && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  return "";
}
