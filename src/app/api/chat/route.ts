import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import en from "@/locales/en.json";
import it from "@/locales/it.json";

export const runtime = "nodejs";

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  lang?: "it" | "en";
}

function readContext(): string {
  try {
    return readFileSync(path.join(process.cwd(), "docs", "ai-context.md"), "utf8");
  } catch {
    return "Gbawia is a shared freight network operating across Italy.";
  }
}

function fallbackReply(lang?: string): string {
  return lang === "en" ? en.docs.noKey : it.docs.noKey;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatBody;
  const key = process.env.OPENROUTER_API_KEY;
  const context = readContext();

  if (!key) {
    return Response.json({ role: "assistant", content: fallbackReply(body.lang) });
  }

  const languagePrompt = body.lang === "en" ? "English" : "Italian";

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Gbawia prototype",
    },
    body: JSON.stringify({
      model: "qwen/qwen-2.5-72b-instruct",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `${context}\n\nReply in ${languagePrompt}. Be concise and friendly.`,
        },
        ...body.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!upstream.ok) {
    return Response.json({ role: "assistant", content: fallbackReply(body.lang) });
  }

  const data = await upstream.json();
  const content: string = data?.choices?.[0]?.message?.content ?? fallbackReply(body.lang);
  return Response.json({ role: "assistant", content });
}