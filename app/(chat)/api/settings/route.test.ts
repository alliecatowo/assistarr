import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn());
const q = vi.hoisted(() => ({
  getServiceConfigs: vi.fn(),
  getServiceConfig: vi.fn(),
  upsertServiceConfig: vi.fn(),
  deleteServiceConfig: vi.fn(),
}));
const clientGet = vi.hoisted(() => vi.fn());
vi.mock("@/app/(auth)/auth", () => ({ auth }));
vi.mock("@/lib/db/queries/service-config", () => q);
vi.mock("@/lib/net/ssrf", () => ({
  assertSafeServiceUrl: vi.fn(async () => undefined),
  UnsafeUrlError: class extends Error {},
}));
vi.mock("@/lib/plugins/radarr/client", () => ({
  RadarrClient: class {
    get = clientGet;
  },
}));
vi.mock("@/lib/plugins/sonarr/client", () => ({}));
vi.mock("@/lib/plugins/jellyseerr/client", () => ({}));
vi.mock("@/lib/plugins/jellyfin/client", () => ({}));
vi.mock("@/lib/plugins/qbittorrent/client", () => ({}));

import { GET, POST, PUT } from "./route";

const stored = {
  id: "1",
  userId: "me",
  serviceName: "radarr",
  baseUrl: "http://radarr:7878",
  apiKey: "REAL-RADARR-KEY",
  username: null,
  password: null,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const send = (method: "POST" | "PUT", body: unknown) =>
  (method === "POST" ? POST : PUT)(
    new Request("http://localhost/api/settings", {
      method,
      body: JSON.stringify(body),
    })
  );

describe("/api/settings secret handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "me" } });
    q.getServiceConfigs.mockResolvedValue([stored]);
    q.getServiceConfig.mockResolvedValue(stored);
    q.upsertServiceConfig.mockImplementation(async (c) => ({
      ...stored,
      ...c,
    }));
    clientGet.mockResolvedValue({});
  });

  it("GET never returns the apiKey or password", async () => {
    q.getServiceConfigs.mockResolvedValue([
      stored,
      {
        ...stored,
        serviceName: "qbittorrent",
        apiKey: "",
        password: "REAL-PASSWORD",
      },
    ]);
    const res = await GET();
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).not.toContain("REAL-RADARR-KEY");
    expect(text).not.toContain("REAL-PASSWORD");
  });

  it("POST responds with a masked config", async () => {
    const res = await send("POST", {
      serviceName: "radarr",
      baseUrl: "http://radarr:7878",
      apiKey: "brand-new-key",
    });
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain("brand-new-key");
    expect(q.upsertServiceConfig).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "brand-new-key" })
    );
  });

  it("POST with the mask placeholder keeps the stored secret", async () => {
    const mask = (await (await GET()).json())[0].apiKey;
    const res = await send("POST", {
      serviceName: "radarr",
      baseUrl: "http://radarr:7878",
      apiKey: mask,
    });
    expect(res.status).toBe(200);
    expect(q.upsertServiceConfig).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "REAL-RADARR-KEY" })
    );
  });

  it("rejects the placeholder when nothing is stored", async () => {
    q.getServiceConfig.mockResolvedValue(null);
    const mask = (await (await GET()).json())[0].apiKey;
    const res = await send("POST", {
      serviceName: "radarr",
      baseUrl: "http://radarr:7878",
      apiKey: mask,
    });
    expect(res.status).toBe(400);
    expect(q.upsertServiceConfig).not.toHaveBeenCalled();
  });

  it("PUT (test connection) resolves the placeholder before calling the service", async () => {
    const mask = (await (await GET()).json())[0].apiKey;
    const res = await send("PUT", {
      serviceName: "radarr",
      baseUrl: "http://radarr:7878",
      apiKey: mask,
    });
    expect(res.status).toBe(200);
    expect(clientGet).toHaveBeenCalled();
  });
});
