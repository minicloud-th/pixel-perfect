import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { ensureThread } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Copilot for work — AI chat assistant" },
      {
        name: "description",
        content:
          "A dark, focused AI chat workspace: draft, brainstorm and plan with Copilot, with every conversation saved in your browser.",
      },
      { property: "og:title", content: "Copilot for work — AI chat assistant" },
      {
        property: "og:description",
        content: "Draft, brainstorm and plan with an AI copilot built for focused work.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const thread = ensureThread();
    void navigate({ to: "/c/$threadId", params: { threadId: thread.id }, replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span className="text-sm text-muted-foreground">Opening Copilot…</span>
    </div>
  );
}
