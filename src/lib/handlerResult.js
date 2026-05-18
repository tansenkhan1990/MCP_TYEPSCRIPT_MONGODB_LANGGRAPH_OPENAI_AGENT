import { toErrorMessage } from "./errors.js";

export async function toHandlerResult(run) {
  try {
    return await run();
  } catch (err) {
    return { result: null, error: toErrorMessage(err) };
  }
}

export function requireNonEmptyQuestion(question) {
  const text = question.trim();
  if (!text) {
    return { result: null, error: "Question cannot be empty." };
  }
  return { question: text };
}
