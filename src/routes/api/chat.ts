import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createLovableResponsesProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are Copilot, a warm and capable work assistant.
Be concise and concrete. Use markdown: short paragraphs, bullet lists, and
headings when they help. When drafting content, produce the draft directly
instead of describing what you would write.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const gateway = createLovableResponsesProvider(key);

        const result = streamText({
          model: gateway("openai/gpt-6-astra"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
          providerOptions: {
            openai: { reasoningEffort: "low" },
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
