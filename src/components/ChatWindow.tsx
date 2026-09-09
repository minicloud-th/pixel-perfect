import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { PenLine, Lightbulb, Map as MapIcon, MessagesSquare } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import mark from "@/assets/copilot-mark.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const STARTERS = [
  { icon: PenLine, label: "Create", prompt: "Draft a short project update for my team." },
  { icon: Lightbulb, label: "Brainstorm", prompt: "Brainstorm 10 ideas for our next launch." },
  { icon: MapIcon, label: "Blueprint", prompt: "Outline a plan for a 4-week product sprint." },
  {
    icon: MessagesSquare,
    label: "Describe",
    prompt: "Explain our pricing model in simple words.",
  },
];

export function ChatWindow({
  threadId,
  initialMessages,
  onMessagesChange,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onMessagesChange: (messages: UIMessage[]) => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error) => toast.error(error.message || "The assistant could not reply."),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    if (!isBusy) inputRef.current?.focus();
  }, [isBusy, threadId]);

  const send = (text: string) => {
    if (!text.trim() || isBusy) return;
    void sendMessage({ text: text.trim() });
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <img
            src={mark}
            alt="Copilot"
            width={512}
            height={512}
            className="h-12 w-12 drop-shadow-[0_6px_20px_oklch(0.72_0.14_250/0.45)]"
          />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your <span className="text-brand-gradient">Copilot</span> for work
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Jumpstart collaboration with a spark of AI. Pick a starting point below, or just
            start writing if you already have something in mind.
          </p>
          <div className="mt-7 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STARTERS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => send(prompt)}
                className="panel group flex flex-col items-center gap-2.5 rounded-xl px-3 py-4 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-primary transition-transform group-hover:-translate-y-0.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={index}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))}
            {status === "submitted" ? (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Thinking...</Shimmer>
                </MessageContent>
              </Message>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      <div className="mx-auto w-full max-w-3xl px-4 pb-5">
        <PromptInput
          className="panel rounded-2xl"
          onSubmit={(message, event) => {
            event.preventDefault();
            send(message.text ?? "");
          }}
        >
          <PromptInputTextarea
            ref={inputRef}
            autoFocus
            placeholder="Message Copilot…"
            className="text-sm"
          />
          <PromptInputFooter className="justify-between">
            <span className="pl-1 text-[11px] text-muted-foreground">
              Copilot can make mistakes. Check important info.
            </span>
            <PromptInputSubmit size="icon-sm" status={status} disabled={isBusy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
