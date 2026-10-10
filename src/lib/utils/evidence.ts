export type EvidenceLink = { kind: "github" | "demo" | "figma" | "other"; url: string };
export type EvidenceFile = { name: string; cid: string; url: string };

export type Evidence = {
  text: string;
  links: EvidenceLink[];
  files: EvidenceFile[];
};

export const LINK_KIND_LABEL: Record<EvidenceLink["kind"], string> = {
  github: "GitHub",
  demo: "Live demo",
  figma: "Figma",
  other: "Link",
};

export function encodeEvidence(evidence: Evidence) {
  return JSON.stringify({
    text: evidence.text,
    links: evidence.links.filter((link) => link.url),
    files: evidence.files,
  });
}

export function decodeEvidence(raw: string): Evidence {
  try {
    const value = JSON.parse(raw) as Partial<Evidence>;
    if (typeof value.text === "string") {
      return {
        text: value.text,
        links: Array.isArray(value.links) ? value.links : [],
        files: Array.isArray(value.files) ? value.files : [],
      };
    }
  } catch {
    return { text: raw, links: [], files: [] };
  }
  return { text: raw, links: [], files: [] };
}
