"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { useLanguage } from "@/lib/i18n";
import { LogoMark } from "@/components/Logo";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DocsPage() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: t("docs.fallbackAsk") }]);
  }, [lang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.content }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t("docs.noKey") }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
        {t("docs.title")}
      </h1>
      <p className="mt-3 text-ink-soft">{t("docs.intro")}</p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-paper">
        <div
          ref={scrollRef}
          className="flex h-[460px] flex-col gap-4 overflow-y-auto px-5 py-6"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <span className="mt-1 shrink-0">
                  <img src="/ai-bot.png" alt="Logo" className="h-6 w-[32.64px]" />
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-ink text-paper"
                    : "bg-paper-dim text-ink"
                }`}
              >
                {m.role === "assistant" ? (
                  <Markdown
                    components={{
                      p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green underline underline-offset-2"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em>{children}</em>,
                      code: ({ children }) => (
                        <code className="rounded bg-ink/10 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="my-2 overflow-x-auto rounded-lg bg-ink px-3 py-2.5 text-xs text-paper">
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-2 border-l-2 border-line-strong pl-3 text-ink-soft">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }) => <h3 className="my-2 font-display text-lg font-semibold">{children}</h3>,
                      h2: ({ children }) => <h4 className="my-2 font-display text-base font-semibold">{children}</h4>,
                      h3: ({ children }) => <h5 className="my-1.5 font-semibold">{children}</h5>,
                      h4: ({ children }) => <h6 className="my-1 font-semibold">{children}</h6>,
                    }}
                  >
                    {m.content}
                  </Markdown>
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex items-start gap-3">
              <span className="mt-1 shrink-0">
                <img src="/ai-bot.png" alt="Logo" className="h-6 w-[32.64px]" />
              </span>
              <div className="rounded-2xl bg-paper-dim px-4 py-3 text-sm text-ink-faint">
                <span className="animate-pulse">•••</span>
              </div>
            </div>
          )}
        </div>

        <form
          className="flex items-center gap-2 border-t border-line px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("docs.placeholder")}
            className="flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-green"
          />
          <button
            type="submit"
            disabled={thinking}
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-green disabled:opacity-40"
          >
            {t("docs.send")}
          </button>
        </form>
      </div>

      <p className="mt-3 text-xs text-ink-faint">{t("docs.sourceNote")}</p>
    </div>
  );
}