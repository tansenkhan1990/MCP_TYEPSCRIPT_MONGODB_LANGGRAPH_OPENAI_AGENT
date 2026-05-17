import {
  isNewsQuery,
  isRateLimitError,
  searchViaHtmlLite,
  searchViaNews,
  searchViaScrape,
} from "./providers.js";

export async function searchDuckDuckGo(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    return "Search query cannot be empty.";
  }

  try {
    if (isNewsQuery(trimmed)) {
      const news = await searchViaNews(trimmed);
      if (news) return news;
    }

    try {
      const api = await searchViaScrape(trimmed);
      if (api) return api;
    } catch (err) {
      if (!isRateLimitError(err)) {
        throw err;
      }
    }

    const html = await searchViaHtmlLite(trimmed);
    if (html) return html;

    return `No DuckDuckGo results for: ${trimmed}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `DuckDuckGo search failed for "${trimmed}": ${message}`;
  }
}
