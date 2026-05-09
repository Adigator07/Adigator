export function cleanOcrText(text: string): string {
  return text
    .replace(/[|]/g, "I")
    .replace(/[{}]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(text: string): string {
  return cleanOcrText(text)
    .toLowerCase()
    .replace(/[^\w%$€£₹.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function containsPhrase(text: string, phrases: string[]): string | null {
  const normalized = normalizeText(text);
  return phrases.find((phrase) => normalized.includes(phrase)) ?? null;
}

export function countSetMatches(tokens: string[], values: Set<string>): number {
  return tokens.reduce((count, token) => count + (values.has(token) ? 1 : 0), 0);
}

export function isAllCapsPhrase(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}
