import { isIP } from "./ip";
import { resolveAll } from "./resolve";

/**
 * SSRF guard for URLs that users configure (arr services, MCP servers,
 * Jellyseerr discovery).
 *
 * Always blocked: link-local (cloud metadata, 169.254.0.0/16, fe80::/10),
 * "this host" (0.0.0.0/8, ::), multicast/reserved and well-known metadata
 * hostnames.
 *
 * Blocked unless ALLOW_PRIVATE_SERVICE_URLS=true: loopback, RFC1918, CGNAT and
 * unique-local ranges. Assistarr is normally self-hosted next to a LAN full of
 * arr servers, so self-hosters opt in; the public demo and any multi-tenant
 * deployment leave it off.
 */

export class UnsafeUrlError extends Error {
  constructor(message = "URL points to a blocked address") {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "metadata.google.internal",
  "metadata",
  "instance-data",
  "instance-data.ec2.internal",
]);

export function allowPrivateServiceUrls(): boolean {
  return process.env.ALLOW_PRIVATE_SERVICE_URLS === "true";
}

function parseV4(ip: string): number[] | null {
  const parts = ip.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)
  ) {
    return null;
  }
  return parts;
}

type Verdict = "ok" | "private" | "blocked";

function classifyV4(p: number[]): Verdict {
  const [a, b] = p;
  if (a === 0 || a >= 224) {
    return "blocked"; // this-host, multicast, reserved, broadcast
  }
  if (a === 169 && b === 254) {
    return "blocked"; // link-local incl. 169.254.169.254 metadata
  }
  if (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  ) {
    return "private";
  }
  return "ok";
}

/** Expand an IPv6 address into 8 16-bit groups, or null if malformed. */
function parseV6(ip: string): number[] | null {
  let addr = ip.split("%")[0].toLowerCase();
  // Embedded dotted IPv4 tail (::ffff:1.2.3.4)
  const tail = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    const v4 = parseV4(tail[1]);
    if (!v4) {
      return null;
    }
    addr = addr.replace(
      tail[1],
      `${((v4[0] << 8) | v4[1]).toString(16)}:${((v4[2] << 8) | v4[3]).toString(16)}`
    );
  }
  const halves = addr.split("::");
  if (halves.length > 2) {
    return null;
  }
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 0) {
    return null;
  }
  const groups = [
    ...head,
    ...(halves.length === 2 ? new Array(missing).fill("0") : []),
    ...rest,
  ].map((g) => Number.parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => g >= 0 && g <= 0xff_ff)
    ? groups
    : null;
}

function classifyV6(g: number[]): Verdict {
  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible: judge the embedded v4.
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xff_ff || g[5] === 0)) {
    if (g.slice(0, 7).every((x) => x === 0) && g[7] <= 1) {
      return g[7] === 1 ? "private" : "blocked"; // ::1 loopback, :: unspecified
    }
    return classifyV4([g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255]);
  }
  if ((g[0] & 0xff_c0) === 0xfe_80) {
    return "blocked"; // fe80::/10 link-local
  }
  if (g[0] === 0xfd_00 && g[1] === 0x0e_c2) {
    return "blocked"; // AWS IMDS over IPv6 (fd00:ec2::254)
  }
  if ((g[0] & 0xfe_00) === 0xfc_00) {
    return "private"; // fc00::/7 unique local
  }
  if ((g[0] & 0xff_00) === 0xff_00) {
    return "blocked"; // multicast
  }
  return "ok";
}

export function classifyIp(ip: string): Verdict {
  const family = isIP(ip);
  if (family === 4) {
    const p = parseV4(ip);
    return p ? classifyV4(p) : "blocked";
  }
  if (family === 6) {
    const g = parseV6(ip);
    return g ? classifyV6(g) : "blocked";
  }
  return "blocked";
}

function verdictAllowed(v: Verdict): boolean {
  return v === "ok" || (v === "private" && allowPrivateServiceUrls());
}

/**
 * Validates a user-supplied service URL: http/https only, no embedded
 * credentials, and every address the host resolves to must be allowed.
 * Returns the parsed URL. Throws UnsafeUrlError otherwise.
 */
export async function assertSafeServiceUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with embedded credentials are not allowed");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const bare = host.endsWith(".") ? host.slice(0, -1) : host;
  if (BLOCKED_HOSTNAMES.has(bare)) {
    throw new UnsafeUrlError();
  }

  let addresses: string[];
  if (isIP(bare)) {
    addresses = [bare];
  } else if (bare === "localhost" || bare.endsWith(".localhost")) {
    addresses = ["127.0.0.1"];
  } else {
    try {
      addresses = await resolveAll(bare);
    } catch {
      throw new UnsafeUrlError("Could not resolve host");
    }
  }
  if (
    addresses.length === 0 ||
    !addresses.every((a) => verdictAllowed(classifyIp(a)))
  ) {
    throw new UnsafeUrlError();
  }
  return url;
}

const MAX_REDIRECTS = 3;

/**
 * fetch() that validates the URL first and follows redirects manually,
 * re-validating every hop so a hostile server cannot bounce the request into a
 * blocked range. Credential headers are dropped when a redirect leaves the
 * original origin.
 */
export async function safeFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  let current = (await assertSafeServiceUrl(url)).toString();
  let options: RequestInit = { ...init, redirect: "manual" };
  const origin = new URL(current).origin;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current, options);
    if (!(response.status >= 300 && response.status < 400)) {
      return response;
    }
    const location = response.headers?.get("location");
    if (!location) {
      return response;
    }
    const next = await assertSafeServiceUrl(
      new URL(location, current).toString()
    );
    if (next.origin !== origin) {
      options = { ...options, headers: stripCredentials(options.headers) };
    }
    if (response.status !== 307 && response.status !== 308) {
      options = { ...options, method: "GET", body: undefined };
    }
    current = next.toString();
  }
  throw new UnsafeUrlError("Too many redirects");
}

const CREDENTIAL_HEADERS = new Set([
  "authorization",
  "cookie",
  "x-api-key",
  "x-emby-token",
  "x-mediabrowser-token",
]);

function stripCredentials(headers: HeadersInit | undefined): Headers {
  const out = new Headers(headers);
  for (const name of [...out.keys()]) {
    if (CREDENTIAL_HEADERS.has(name.toLowerCase())) {
      out.delete(name);
    }
  }
  return out;
}
