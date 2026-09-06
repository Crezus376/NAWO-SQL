export type CustomPageHighlight = { title: string; text: string };
export type CustomPageLineupItem = { name: string; role?: string };

export type CustomPageTheme = "gold" | "violet" | "neon";

export type CustomPageContent = {
  theme?: CustomPageTheme;
  tagline?: string;
  headline?: string;
  subheadline?: string;
  about?: string;
  heroImage?: string;
  highlights?: CustomPageHighlight[];
  lineup?: CustomPageLineupItem[];
  gallery?: string[];
  ctaLabel?: string;
  dressCode?: string;
  infoNote?: string;
};

export const CUSTOM_PAGE_THEMES: Record<
  CustomPageTheme,
  { label: string; page: string; accent: string; accentSoft: string; border: string }
> = {
  gold: {
    label: "Or & noir",
    page: "bg-[#08070a] text-[#f4efe4]",
    accent: "text-[#d8b366]",
    accentSoft: "bg-[#d8b366]/12",
    border: "border-[#d8b366]/30",
  },
  violet: {
    label: "Violet nuit",
    page: "bg-[#0d0718] text-[#f2ecff]",
    accent: "text-[#c4a2ff]",
    accentSoft: "bg-[#c4a2ff]/12",
    border: "border-[#c4a2ff]/30",
  },
  neon: {
    label: "Néon rose",
    page: "bg-[#0a0610] text-[#ffeef7]",
    accent: "text-[#ff77b0]",
    accentSoft: "bg-[#ff77b0]/12",
    border: "border-[#ff77b0]/30",
  },
};

export function parseCustomPageContent(raw: unknown): CustomPageContent {
  if (!raw || typeof raw !== "object") return {};
  return raw as CustomPageContent;
}
