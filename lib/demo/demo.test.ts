import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QBittorrentClient } from "@/lib/plugins/qbittorrent/client";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import {
  RadarrMovieArraySchema,
  RadarrQualityProfileArraySchema,
  RadarrQueueResponseSchema,
  RadarrRootFolderArraySchema,
  RadarrSystemStatusSchema,
} from "@/lib/plugins/radarr/schemas";
import { SonarrClient } from "@/lib/plugins/sonarr/client";
import {
  SonarrCalendarEpisodeArraySchema,
  SonarrSeriesArraySchema,
} from "@/lib/plugins/sonarr/schemas";
import { scriptedModel } from "./scripted-model";
import { demoServiceConfigs } from "./service-configs";

const configs = demoServiceConfigs("11111111-1111-4111-8111-111111111111");
const cfg = (name: string) => {
  const c = configs.find((x) => x.serviceName === name);
  if (!c) {
    throw new Error(name);
  }
  return c;
};

describe("demo mode servarr fixtures", () => {
  beforeEach(() => {
    process.env.DEMO_MODE = "true";
  });
  afterEach(() => {
    // biome-ignore lint/performance/noDelete: env cleanup
    delete process.env.DEMO_MODE;
  });

  it("serves schema-valid Radarr data", async () => {
    const c = new RadarrClient(cfg("radarr"));
    expect(
      RadarrSystemStatusSchema.safeParse(await c.getSystemStatus()).success
    ).toBe(true);
    const movies = await c.get("/movie", undefined, {
      schema: RadarrMovieArraySchema,
    });
    expect(movies.length).toBeGreaterThan(5);
    await c.get("/queue", { page: 1 }, { schema: RadarrQueueResponseSchema });
    await c.get("/qualityprofile", undefined, {
      schema: RadarrQualityProfileArraySchema,
    });
    await c.get("/rootfolder", undefined, {
      schema: RadarrRootFolderArraySchema,
    });
    const found = await c.get<Array<{ title: string }>>(
      "/movie/lookup",
      { term: "duck soup" },
      { schema: RadarrMovieArraySchema }
    );
    expect(found.map((m) => m.title)).toContain("Duck Soup");
  });

  it("serves schema-valid Sonarr data", async () => {
    const c = new SonarrClient(cfg("sonarr"));
    await c.get("/series", undefined, { schema: SonarrSeriesArraySchema });
    const cal = await c.getCalendar(new Date(), new Date());
    expect(SonarrCalendarEpisodeArraySchema.safeParse(cal).success).toBe(true);
    expect((await c.getQueue()).length).toBeGreaterThan(0);
  });

  it("serves qBittorrent over the demo host", async () => {
    const c = new QBittorrentClient(cfg("qbittorrent"));
    expect((await c.getTorrents()).length).toBeGreaterThan(0);
  });

  it("refuses non-demo hosts", async () => {
    const c = new RadarrClient({
      ...cfg("radarr"),
      baseUrl: "http://10.0.0.1",
    });
    await expect(c.get("/movie", undefined, { retry: false })).rejects.toThrow(
      /demo mode/
    );
  });
});

describe("scripted model", () => {
  const model = scriptedModel as unknown as {
    doStream: (o: unknown) => Promise<{ stream: ReadableStream }>;
  };
  async function run(prompt: unknown, tools: Array<{ name: string }>) {
    const { stream } = await model.doStream({ prompt, tools });
    const out: Record<string, unknown>[] = [];
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      out.push(value);
    }
    return out;
  }
  const user = (text: string) => [
    { role: "user", content: [{ type: "text", text }] },
  ];

  it("calls only available tools", async () => {
    const parts = await run(user("what's downloading?"), [
      { name: "getRadarrQueue" },
    ]);
    const calls = parts.filter((p) => p.type === "tool-call");
    expect(calls.map((c) => c.toolName)).toEqual(["getRadarrQueue"]);
    expect(parts.at(-1)?.finishReason).toBe("tool-calls");
  });

  it("summarises tool results", async () => {
    const prompt = [
      ...user("what's downloading?"),
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            output: {
              type: "json",
              value: {
                message: "Found 1 movie(s) in the download queue.",
                items: [{ movieTitle: "The General", progress: "66%" }],
              },
            },
          },
        ],
      },
    ];
    const parts = await run(prompt, []);
    const text = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => p.delta)
      .join("");
    expect(text).toContain("The General");
  });
});
