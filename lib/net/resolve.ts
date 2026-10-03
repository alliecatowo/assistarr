/**
 * DNS resolution for the SSRF guard.
 *
 * Uses process.getBuiltinModule so bundlers do not try to resolve `dns` for the
 * client graph (the plugin registry is imported by client components for tool
 * metadata). Only ever called on the server.
 */
export async function resolveAll(host: string): Promise<string[]> {
  const dns = process.getBuiltinModule?.("dns/promises");
  if (!dns) {
    throw new Error("DNS resolution is only available on the server");
  }
  const results = await dns.lookup(host, { all: true });
  return results.map((r) => r.address);
}
