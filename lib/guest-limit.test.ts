import { beforeEach, describe, expect, it, vi } from "vitest";

const ip = vi.hoisted(() => ({ value: "192.0.2.1" }));
vi.mock("@/lib/client-ip", () => ({ getClientIp: async () => ip.value }));

import { allowGuestCreation, guestCreationAllowed } from "./guest-limit";

describe("guest creation limit", () => {
  beforeEach(() => {
    ip.value = `192.0.2.${Math.floor(Math.random() * 200)}`;
  });

  it("caps guest creation per IP and isolates IPs", async () => {
    let ok = 0;
    for (let i = 0; i < 45; i++) {
      if (await allowGuestCreation()) {
        ok++;
      }
    }
    expect(ok).toBe(30);
    expect(await guestCreationAllowed()).toBe(false);
    ip.value = "198.51.100.200";
    expect(await guestCreationAllowed()).toBe(true);
  });
});
