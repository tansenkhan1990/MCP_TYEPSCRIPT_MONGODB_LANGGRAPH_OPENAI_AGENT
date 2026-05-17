import { search, searchNews } from "duck-duck-scrape";

export const MAX_RESULTS = 8;
const RETRY_DELAYS_MS = [0, 2000, 5000];

export const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

const NEWS_QUERY_PATTERN = /\b(news|headlines|latest|today)\b/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function decodeHtml(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function formatResults(query, items, source) {
  if (!items.length) {
    return null;
  }

  const lines = items.slice(0, MAX_RESULTS).map((item, index) => {
    return `${index + 1}. ${item.title}\n   URL: ${item.url}\n   ${item.snippet}`;
  });

  return `DuckDuckGo results for "${query}" (${source}):\n\n${lines.join("\n\n")}`;
}

export function isRateLimitError(err) {
  const message = err instanceof Error ? err.message : String(err);
  return /anomaly|too quickly|rate.?limit|506/i.test(message);
}

export function isNewsQuery(query) {
  return NEWS_QUERY_PATTERN.test(query);
}

export async function searchViaScrape(query) {
  const needleOptions = { headers: BROWSER_HEADERS };

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt] > 0) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }

    try {
      const results = await search(query, { safeSearch: 0 }, needleOptions);
      if (results?.noResults || !results?.results?.length) {
        return null;
      }

      return formatResults(
        query,
        results.results.map((item) => ({
          title: item.title ?? "Untitled",
          url: item.url ?? item.hostname ?? "",
          snippet: (item.description ?? "").trim(),
        })),
        "api",
      );
    } catch (err) {
      if (!isRateLimitError(err) || attempt === RETRY_DELAYS_MS.length - 1) {
        throw err;
      }
    }
  }

  return null;
}

export async function searchViaNews(query) {
  try {
    const results = await searchNews(
      query,
      { safeSearch: -2, time: "d" },
      { headers: BROWSER_HEADERS },
    );

    if (!results?.results?.length) {
      return null;
    }

    return formatResults(
      query,
      results.results.map((item) => ({
        title: item.title ?? "Untitled",
        url: item.url ?? "",
        snippet: (item.excerpt ?? item.snippet ?? "").trim(),
      })),
      "news",
    );
  } catch {
    return null;
  }
}

export async function searchViaHtmlLite(query) {
  const body = new URLSearchParams({
    q: query,
    b: "",
    kl: "wt-wt",
    df: isNewsQuery(query) ? "d" : "",
  }).toString();

  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`HTML search HTTP ${response.status}`);
  }

  const html = await response.text();
  const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  const links = [...html.matchAll(linkRegex)];
  const snippets = [...html.matchAll(snippetRegex)];
  const items = [];

  for (let i = 0; i < links.length && i < MAX_RESULTS; i++) {
    const [, rawUrl, rawTitle] = links[i];
    let url = decodeHtml(rawUrl);
    if (url.startsWith("//")) {
      url = `https:${url}`;
    }
    items.push({
      title: decodeHtml(rawTitle).trim(),
      url,
      snippet: snippets[i] ? decodeHtml(snippets[i][1]).trim() : "",
    });
  }

  return formatResults(query, items, "html");
}
