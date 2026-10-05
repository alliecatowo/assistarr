import { describe, expect, it } from "vitest";
import type { ServiceConfig } from "@/lib/db/schema";
import {
  isMaskedSecret,
  maskServiceConfig,
  resolveSecret,
  SECRET_MASK,
} from "./mask";

const config = {
  id: "1",
  userId: "u",
  serviceName: "radarr",
  baseUrl: "http://radarr:7878",
  apiKey: "super-secret-api-key",
  username: "admin",
  password: "super-secret-password",
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as ServiceConfig;

describe("maskServiceConfig", () => {
  it("never returns the real apiKey or password", () => {
    const masked = maskServiceConfig(config);
    const json = JSON.stringify(masked);

    expect(json).not.toContain("super-secret");
    expect(masked.apiKey).toBe(SECRET_MASK);
    expect(masked.password).toBe(SECRET_MASK);
    expect(masked.baseUrl).toBe(config.baseUrl);
    expect(masked.username).toBe("admin");
  });

  it("leaves unset secrets empty so the UI can tell them apart", () => {
    const masked = maskServiceConfig({ ...config, apiKey: "", password: null });
    expect(masked.apiKey).toBe("");
    expect(masked.password).toBeNull();
  });
});

describe("resolveSecret", () => {
  it("swaps the mask for the stored secret and passes new values through", () => {
    expect(isMaskedSecret(SECRET_MASK)).toBe(true);
    expect(resolveSecret(SECRET_MASK, "stored")).toBe("stored");
    expect(resolveSecret(SECRET_MASK, undefined)).toBe("");
    expect(resolveSecret("brand-new", "stored")).toBe("brand-new");
  });
});
