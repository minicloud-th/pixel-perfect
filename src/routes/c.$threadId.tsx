import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { Menu, MessageSquarePlus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import mark from "@/assets/copilot-mark.png";
import { ChatWindow } from "@/components/ChatWindow";
import {
  createThread,
  deleteThread,
  loadThreads,
  titleFromMessages,
  upsertThread,
  type Thread,
} from "@/lib/threads";

export const Route = createFileRoute("/c/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat with Copilot — AI workspace" },
      {
        name: "description",
        content:
          "Continue a saved Copilot conversation: draft content, brainstorm ideas and plan work in a focused dark chat workspace.",
      },
      { property: "og:title", content: "Chat with Copilot — AI workspace" },
      {
        property: "og:description",
        content: "Continue a saved Copilot conversation in a focused dark chat workspace.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = useParams({ from: "/c/$threadId" });
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = loadThreads();
    if (!stored.some((t) => t.id === threadId)) {
      const fresh: Thread = { ...createThread(), id: threadId };
      upsertThread(fresh);
      setThreads([fresh, ...stored]);
    } else {
      setThreads(stored);
    }
    setReady(true);
  }, [threadId]);

  const active = threads.find((t) => t.id === threadId);

  const handleMessagesChange = useCallback(
    (messages: UIMessage[]) => {
      if (messages.length === 0) return;
      setThreads((prev) => {
        const current = prev.find((t) => t.id === threadId);
        if (!current) return prev;
        const updated: Thread = {
          ...current,
          messages,
          title: titleFromMessages(messages, current.title),
          updatedAt: Date.now(),
        };
        upsertThread(updated);
        return [updated, ...prev.filter((t) => t.id !== threadId)];
      });
    },
    [threadId],
  );

  const startNewChat = () => {
    const thread = createThread();
    upsertThread(thread);
    setThreads((prev) => [thread, ...prev]);
    setSidebarOpen(false);
    void navigate({ to: "/c/$threadId", params: { threadId: thread.id } });
  };

  const removeThread = (id: string) => {
    const remaining = deleteThread(id);
    setThreads(remaining);
    if (id === threadId) {
      const next = remaining[0] ?? createThread();
      if (!remaining[0]) upsertThread(next);
      void navigate({ to: "/c/$threadId", params: { threadId: next.id }, replace: true });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close conversations"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <img src={mark} alt="" width={512} height={512} className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-tight">Copilot</span>
          </div>
          <button
            type="button"
            aria-label="Close conversations"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3">
          <button
            type="button"
            onClick={startNewChat}
            className="flex w-full items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/60 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-sidebar-accent"
          >
            <MessageSquarePlus className="h-4 w-4 text-primary" />
            New chat
          </button>
        </div>

        <p className="px-4 pb-2 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Conversations
        </p>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`group flex items-center gap-1 rounded-lg px-1 ${
                thread.id === threadId ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  void navigate({ to: "/c/$threadId", params: { threadId: thread.id } });
                }}
                className="flex-1 truncate px-2 py-2 text-left text-sm text-sidebar-foreground"
              >
                {thread.title}
              </button>
              <button
                type="button"
                aria-label={`Delete ${thread.title}`}
                onClick={() => removeThread(thread.id)}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            aria-label="Open conversations"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <h2 className="truncate text-sm font-medium">{active?.title ?? "New chat"}</h2>
        </header>

        {ready ? (
          <ChatWindow
            key={threadId}
            threadId={threadId}
            initialMessages={active?.messages ?? []}
            onMessagesChange={handleMessagesChange}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        )}
      </main>
    </div>
  );
}
