function firstNonEmpty(values: Array<string | undefined>) {
  for (const value of values) {
    const trimmed = (value || "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function getServerAgentApiUrl() {
  return firstNonEmpty([
    process.env.AGENT_API_URL,
    process.env.NEXT_PUBLIC_AGENT_API_URL,
  ]);
}

export function getServerCrosschainApiUrl() {
  return firstNonEmpty([
    process.env.CROSSCHAIN_API_URL,
    process.env.NEXT_PUBLIC_CROSSCHAIN_API_URL,
  ]);
}

export function getServerGeminiApiKey() {
  return firstNonEmpty([
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_API_KEY,
  ]);
}
