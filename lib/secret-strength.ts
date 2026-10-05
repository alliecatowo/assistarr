const MIN_SECRET_LENGTH = 32;

const PLACEHOLDER = /^(change-?me|your-|replace-|example|placeholder)/i;

/** True for empty, short or copy-pasted example secrets. */
export function isWeakSecret(value: string | undefined | null): boolean {
  const v = value?.trim();
  if (!v || v.length < MIN_SECRET_LENGTH) {
    return true;
  }
  return PLACEHOLDER.test(v);
}
