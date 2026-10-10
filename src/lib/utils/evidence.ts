export type Evidence = { text: string; url?: string };

export function encodeEvidence(evidence: Evidence) {
  return JSON.stringify({ text: evidence.text, url: evidence.url || undefined });
}

export function decodeEvidence(raw: string): Evidence {
  try {
    const value = JSON.parse(raw) as { text?: unknown; url?: unknown };
    if (typeof value.text === "string") {
      return { text: value.text, url: typeof value.url === "string" ? value.url : undefined };
    }
  } catch {
    return { text: raw };
  }
  return { text: raw };
}
