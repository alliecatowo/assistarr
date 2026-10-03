const V4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Minimal isIP (0 | 4 | 6) without node:net so it can sit in the client graph. */
export function isIP(value: string): 0 | 4 | 6 {
  if (V4.test(value)) {
    return 4;
  }
  if (value.includes(":") && /^[0-9a-fA-F:.%a-zA-Z]+$/.test(value)) {
    return 6;
  }
  return 0;
}
