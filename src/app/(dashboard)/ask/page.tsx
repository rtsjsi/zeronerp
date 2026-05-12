/**
 * Ask ERP — AI Assistant Page
 * 
 * Persistent AI chat interface where users can ask anything about
 * their business data or how to use the ERP.
 */

"use client";

import { useState } from "react";
import { Send, Sparkles, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { AiIndicator } from "@/components/shared/ai-indicator";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AskERPPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: Wire up to ai.service.ts via API route
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm the ZeronERP AI assistant. Once connected to your business data, I'll be able to answer questions like \"What was my best selling item this quarter?\" or \"How do I create a purchase order?\". This feature will be fully operational once the AI service is configured with your Anthropic API key.",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <PageHeader
        title="Ask ERP"
        description="Your AI business assistant"
        breadcrumbs={[{ label: "Ask ERP" }]}
        actions={<AiIndicator label="Powered by Claude" />}
      />

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Ask me anything about your business
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              I can answer questions about your sales, inventory, suppliers, and more.
              I can also help you learn how to use ZeronERP.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {[
                "What was my top selling item this month?",
                "Which suppliers do I owe money to?",
                "How do I create a sales invoice?",
                "Show me low stock items",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-2 rounded-lg bg-muted hover:bg-accent text-xs text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 max-w-2xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary",
              )}
            >
              {msg.role === "user" ? (
                <UserIcon className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-2 items-end max-w-2xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your business…"
            className="resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          AI responses are based on your business data. Always verify important decisions.
        </p>
      </div>
    </div>
  );
}
