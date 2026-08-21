import type { Language, LocalizedText } from "./types";

/** Resolve a bilingual string for the active language. */
export function tx(text: LocalizedText, lang: Language): string {
  return text[lang];
}
