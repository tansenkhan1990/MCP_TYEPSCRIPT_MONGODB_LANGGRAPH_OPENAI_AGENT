export function parseQuestionFromBody(body) {
  const question =
    typeof body?.question === "string"
      ? body.question
      : typeof body?.query === "string"
        ? body.query
        : "";

  return question.trim();
}
