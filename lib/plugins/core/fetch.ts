import { DEMO_BASE_URL, isDemoMode } from "@/lib/demo/mode";
import { demoFetch } from "@/lib/demo/servarr";

/**
 * fetch() for calls to user-configured services. In demo mode, URLs under the
 * synthetic demo host are answered from fixtures; everything else is refused so
 * a public demo can never be used to reach arbitrary hosts.
 */
export function servarrFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  if (isDemoMode()) {
    if (!url.startsWith(`${DEMO_BASE_URL}/`)) {
      return Promise.reject(
        new Error("Outbound requests are disabled in demo mode")
      );
    }
    return Promise.resolve(demoFetch(url, init));
  }
  return fetch(url, init);
}
