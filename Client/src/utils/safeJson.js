/**
 * Safely parses a fetch Response body as JSON — never throws the raw
 * "Unexpected end of JSON input" from calling response.json() on an empty or
 * truncated body (a 204, a dev-server restart mid-request, a network
 * interruption cutting the response short). Returns null for a genuinely
 * empty body; throws a clear, catchable error for a non-empty body that
 * isn't valid JSON, instead of letting the cryptic parse error escape.
 */
export async function safeJsonParse(response, context = 'response') {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Received an invalid response from the server (${context}). Please try again.`);
  }
}
