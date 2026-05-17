const LIMIT_BYTES = 1024 * 1024;

/**
 * Parse JSON with fixes for common Postman/copy-paste mistakes (trailing commas).
 */
export function tryParseJson(raw) {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) {
    return { ok: true, value: {} };
  }

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (firstError) {
    const withoutTrailingCommas = text
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/\}\s*,\s*$/g, "}");
    try {
      return { ok: true, value: JSON.parse(withoutTrailingCommas) };
    } catch {
      return {
        ok: false,
        error: firstError instanceof Error ? firstError.message : String(firstError),
        preview: text.slice(0, 200),
      };
    }
  }
}

/**
 * Reads POST/PUT/PATCH body as JSON, plain text, or form-urlencoded.
 */
export function lenientBodyParser(req, res, next) {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  const contentType = (req.headers["content-type"] || "").toLowerCase();

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return readBody(req, res, (raw) => {
      const params = new URLSearchParams(raw);
      req.body = Object.fromEntries(params.entries());
      next();
    });
  }

  return readBody(req, res, (raw) => {
    const trimmed = raw.trim();

    if (!trimmed) {
      req.body = {};
      return next();
    }

    if (contentType.includes("text/plain") || !trimmed.startsWith("{")) {
      req.body = { question: trimmed };
      return next();
    }

    const parsed = tryParseJson(trimmed);
    if (!parsed.ok) {
      return res.status(400).json({
        error: "Invalid JSON in request body.",
        hint: 'Use one JSON object, no trailing comma: {"question":"your message"}',
        details: parsed.error,
        receivedPreview: parsed.preview,
      });
    }

    req.body = parsed.value;
    next();
  });
}

function readBody(req, res, onComplete) {
  const chunks = [];
  let size = 0;

  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > LIMIT_BYTES) {
      res.status(413).json({ error: "Request body too large (max 1mb)" });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", () => {
    onComplete(Buffer.concat(chunks).toString("utf8"));
  });

  req.on("error", (err) => {
    res.status(400).json({ error: err.message });
  });
}
