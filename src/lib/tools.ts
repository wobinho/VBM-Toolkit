export type ToolStatus = "live" | "drafting" | "queued";

export type ToolEntry = {
  no: string;
  slug: string;
  href: string | null;
  name: string;
  blurb: string;
  status: ToolStatus;
  category: string;
};

export const TOOLS: ToolEntry[] = [
  {
    no: "01",
    slug: "portrait-prompt",
    href: "/tools/portrait-prompt",
    name: "Portrait Prompt Studio",
    blurb:
      "Modular Midjourney prompt assembler — pair a curated feature library with a base template to spin off thousands of distinct portraits.",
    status: "live",
    category: "Generative",
  },
  {
    no: "02",
    slug: "roster-namer",
    href: null,
    name: "Roster Name Forge",
    blurb:
      "Procedural name generator weighted by region, era and pronunciation phonemes — wired straight to the player import pipeline.",
    status: "queued",
    category: "Database",
  },
  {
    no: "03",
    slug: "schedule-architect",
    href: null,
    name: "Schedule Architect",
    blurb:
      "Round-robin and bracket builder with rest-day constraints, travel weights and broadcast windows.",
    status: "queued",
    category: "League Ops",
  },
  {
    no: "04",
    slug: "attribute-balancer",
    href: null,
    name: "Attribute Balancer",
    blurb:
      "Visual histogram tool for stress-testing player attribute curves and detecting power-level drift across leagues.",
    status: "queued",
    category: "Balance",
  },
  {
    no: "05",
    slug: "kit-designer",
    href: null,
    name: "Kit Designer",
    blurb:
      "Stripe, sash, panel and trim composer for jersey/shorts/socks — exports to the in-game palette format.",
    status: "queued",
    category: "Visual",
  },
  {
    no: "06",
    slug: "scout-report",
    href: null,
    name: "Scout Report Composer",
    blurb:
      "Templated scouting blurbs with attribute-aware language — writes flavour copy for the youth intake screen.",
    status: "queued",
    category: "Narrative",
  },
];
