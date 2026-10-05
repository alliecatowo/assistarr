// Client-safe constants - can be imported anywhere (browser or server)
export const guestRegex = /^guest-\d+$/;

/** Query param the guest route adds to its return URL (see proxy.ts). */
export const GUEST_MARKER = "_g";

/** Add the guest marker to a same-origin redirect target. */
export function withGuestMarker(target: string, base: string): string {
  const url = new URL(target, base);
  url.searchParams.set(GUEST_MARKER, "1");
  return url.toString();
}
