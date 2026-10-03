import type { LanguageModel } from "ai";

/**
 * A tiny keyword-driven "model" used by the public demo when no AI provider
 * key is configured. It picks read-only tools from the user's last message,
 * emits real tool calls (so the tool UI renders), then summarises the results.
 * It costs nothing and cannot be prompt-injected into doing anything.
 */

type AnyRecord = Record<string, unknown>;

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

const HELP = `This is the **Assistarr public demo**. It runs against a fake media server (a small made-up library) and a scripted assistant instead of a real LLM, so it understands a handful of requests:

- "What's downloading right now?"
- "What's coming up on the calendar?"
- "Show my movie library" / "Show my TV shows"
- "Search for Safety Last" / "Find Duck Soup"
- "What quality profiles do I have?"
- "Delete a movie" (shows the approval prompt; nothing is ever applied)

Install Assistarr yourself (see the GitHub repo) to connect your real Radarr, Sonarr, qBittorrent, Jellyfin and Jellyseerr and chat with a real model.`;

function lastUserText(prompt: unknown): string {
  const msgs = (prompt as Array<{ role: string; content: unknown }>) ?? [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === "user") {
      const c = msgs[i].content;
      if (typeof c === "string") {
        return c;
      }
      if (Array.isArray(c)) {
        return c
          .map((p: AnyRecord) => (p.type === "text" ? String(p.text) : ""))
          .join(" ");
      }
    }
  }
  return "";
}

/** Tool results produced after the last user message. */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: prompt walker
function toolResults(prompt: unknown): unknown[] {
  const msgs = (prompt as Array<{ role: string; content: unknown }>) ?? [];
  const out: unknown[] = [];
  for (let i = msgs.length - 1; i >= 0 && msgs[i].role !== "user"; i--) {
    if (msgs[i].role === "tool" && Array.isArray(msgs[i].content)) {
      for (const part of msgs[i].content as AnyRecord[]) {
        if (part.type === "tool-result") {
          const o = part.output as AnyRecord | undefined;
          out.unshift(o && "value" in o ? o.value : o);
        }
      }
    }
  }
  return out;
}

function extractQuery(text: string): string {
  const m = text.match(
    /(?:search(?:\s+for)?|find|look\s*up|lookup|add|request|get me|do i have)\s+(?:the\s+(?:movie|show|series)\s+)?["“]?(.+?)["”]?\s*[?.!]*$/i
  );
  return (m?.[1] ?? text).replace(/\b(movie|show|series|tv)\b/gi, "").trim();
}

type Call = { name: string; input: AnyRecord };

function plan(text: string, available: Set<string>): Call[] {
  const t = text.toLowerCase();
  const calls: Call[] = [];
  const add = (name: string, input: AnyRecord = {}) => {
    if (available.has(name)) {
      calls.push({ name, input });
    }
  };

  if (/\b(delete|remove)\b.*\bmovie/.test(t)) {
    // Destructive: the tool is gated by needsApproval, so this only ever
    // produces an approval card in the demo; nothing is applied.
    add("deleteRadarrMovie", { movieId: 1, deleteFiles: false });
  } else if (/queue|download|progress|torrent/.test(t)) {
    add("getRadarrQueue");
    add("getSonarrQueue");
  } else if (/calendar|upcoming|coming|airing|schedule|release/.test(t)) {
    add("getRadarrCalendar", { days: 30 });
    add("getSonarrCalendar", { days: 14 });
  } else if (/quality|profile/.test(t)) {
    add("getRadarrQualityProfiles");
  } else if (/search|find|look ?up|add|request|do i have/.test(t)) {
    const query = extractQuery(text);
    add("searchRadarrMovies", { query });
    add("searchSonarrSeries", { query });
  } else if (
    /\b(show|shows|series|tv)\b/.test(t) &&
    /library|my|list|have|all|show/.test(t)
  ) {
    add("getSonarrLibrary", { limit: 20 });
  } else if (/\b(movie|movies|film|films|library|collection)\b/.test(t)) {
    add("getRadarrLibrary", { limit: 20 });
    if (/library|collection|everything|all/.test(t)) {
      add("getSonarrLibrary", { limit: 20 });
    }
  }
  return calls;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: field formatter
function line(item: AnyRecord): string {
  const title =
    (item.title as string) ??
    (item.movieTitle as string) ??
    (item.seriesTitle as string) ??
    (item.name as string) ??
    "Untitled";
  const bits: string[] = [];
  if (item.episodeTitle) {
    bits.push(
      `S${String(item.seasonNumber ?? 0).padStart(2, "0")}E${String(item.episodeNumber ?? 0).padStart(2, "0")} ${item.episodeTitle}`
    );
  }
  if (item.year) {
    bits.push(String(item.year));
  }
  if (item.progress) {
    bits.push(
      `${item.progress}${item.timeLeft ? `, ${item.timeLeft} left` : ""}`
    );
  }
  if (item.quality && typeof item.quality === "string") {
    bits.push(item.quality);
  }
  if (item.status && typeof item.status === "string") {
    bits.push(item.status);
  }
  if (item.releaseDate) {
    bits.push(`releases ${String(item.releaseDate).slice(0, 10)}`);
  }
  if (item.airDate) {
    bits.push(`airs ${item.airDate}`);
  }
  if (typeof item.cutoff === "number") {
    bits.push(`upgrades ${item.upgradeAllowed ? "allowed" : "off"}`);
  }
  return `- **${title}**${bits.length ? ` (${bits.join(" · ")})` : ""}`;
}

function summarise(results: unknown[]): string {
  const sections: string[] = [];
  for (const r of results) {
    if (!r || typeof r !== "object") {
      continue;
    }
    const rec = r as AnyRecord;
    const arr = ["items", "results", "movies", "episodes", "profiles"]
      .map((k) => rec[k])
      .find(Array.isArray) as AnyRecord[] | undefined;
    const head = typeof rec.message === "string" ? rec.message : "";
    const body = arr?.length ? arr.slice(0, 10).map(line).join("\n") : "";
    if (head || body) {
      sections.push([head, body].filter(Boolean).join("\n\n"));
    }
  }
  if (!sections.length) {
    return HELP;
  }
  return `${sections.join("\n\n")}\n\n_Demo data: this is a fake library, and changes are never applied._`;
}

function stream(parts: AnyRecord[]) {
  return {
    stream: new ReadableStream({
      async start(controller) {
        controller.enqueue({ type: "stream-start", warnings: [] });
        for (const p of parts) {
          controller.enqueue(p);
          if (p.type === "text-delta") {
            await new Promise((r) => setTimeout(r, 8));
          }
        }
        controller.close();
      },
    }),
  };
}

function textParts(text: string): AnyRecord[] {
  const chunks = text.match(/\S+\s*/g) ?? [text];
  return [
    { type: "text-start", id: "t1" },
    ...chunks.map((delta) => ({ type: "text-delta", id: "t1", delta })),
    { type: "text-end", id: "t1" },
    {
      type: "finish",
      finishReason: { unified: "stop", raw: undefined },
      usage,
    },
  ];
}

export const scriptedModel = {
  specificationVersion: "v4",
  provider: "demo",
  modelId: "demo-scripted",
  supportedUrls: {},
  // biome-ignore lint/suspicious/useAwait: interface requires a promise
  async doGenerate({ prompt }: { prompt: unknown }) {
    // Used for chat titles: a short slice of the user's message.
    const text = lastUserText(prompt).replace(/\s+/g, " ").trim();
    return {
      finishReason: { unified: "stop", raw: undefined },
      usage,
      content: [{ type: "text", text: text.slice(0, 48) || "Demo chat" }],
      warnings: [],
    };
  },
  // biome-ignore lint/suspicious/useAwait: interface requires a promise
  async doStream({
    prompt,
    tools,
  }: {
    prompt: unknown;
    tools?: Array<{ name: string }>;
  }) {
    const results = toolResults(prompt);
    if (results.length > 0) {
      return stream(textParts(summarise(results)));
    }
    const available = new Set((tools ?? []).map((t) => t.name));
    const calls = plan(lastUserText(prompt), available);
    if (calls.length === 0) {
      return stream(textParts(HELP));
    }
    return stream([
      ...calls.map((c, i) => ({
        type: "tool-call",
        toolCallId: `demo-call-${i}-${Date.now()}`,
        toolName: c.name,
        input: JSON.stringify(c.input),
      })),
      {
        type: "finish",
        finishReason: { unified: "tool-calls", raw: undefined },
        usage,
      },
    ]);
  },
} as unknown as LanguageModel;
