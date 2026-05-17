const QUESTION_KEYS = ["question", "query"];

export function parseQuestionFromBody(body) {
  if (!body || typeof body !== "object") {
    return "";
  }

  for (const key of QUESTION_KEYS) {
    if (typeof body[key] === "string" && body[key].trim()) {
      return body[key].trim();
    }
  }

  return "";
}
