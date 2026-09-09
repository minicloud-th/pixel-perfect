import { createOpenAI } from "@ai-sdk/openai";

/**
 * Lovable AI Gateway provider for OpenAI models via the Responses API.
 * Server-only: never import from client code.
 */
export function createLovableResponsesProvider(lovableApiKey: string) {
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: "lovable",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}
