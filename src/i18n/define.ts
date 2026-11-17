/**
 * One area of the UI's messages: English is the source of truth and Portuguese must have exactly the same keys
 * (a missing or extra key is a compile error). Placeholders are `{name}` and must match in both languages (checked by a test).
 */
export function defineMessages<const E extends Record<string, string>>(en: E, pt: Record<keyof E, string>) {
  return { en, pt } as const;
}
