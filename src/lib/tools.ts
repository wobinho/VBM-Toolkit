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
    name: "Portrait Studio",
    blurb:
      "Modular Midjourney prompt assembler — pair a curated feature library with a base template to spin off thousands of distinct portraits.",
    status: "live",
    category: "Generative",
  },
  {
    no: "02",
    slug: "club-badge",
    href: "/tools/club-badge",
    name: "Badge Builder",
    blurb:
      "Slot-based badge prompt builder — pick a shape, a central motif and a three-colour palette, with a lockable library behind every field.",
    status: "live",
    category: "Visual",
  },
  {
    no: "03",
    slug: "player-forge",
    href: "/tools/player-forge",
    name: "Player Forge",
    blurb:
      "Mass-create custom players for the Custom Save importer — bio fields with scoped randomization, grouped stat editor with ±5 jitter, and five-tier archetype presets.",
    status: "live",
    category: "Database",
  },
  {
    no: "04",
    slug: "schedule-architect",
    href: null,
    name: "Schedule Architect",
    blurb:
      "Round-robin and bracket builder with rest-day constraints, travel weights and broadcast windows.",
    status: "queued",
    category: "League Ops",
  },
  {
    no: "05",
    slug: "attribute-balancer",
    href: null,
    name: "Attribute Balancer",
    blurb:
      "Visual histogram tool for stress-testing player attribute curves and detecting power-level drift across leagues.",
    status: "queued",
    category: "Balance",
  },
  {
    no: "06",
    slug: "kit-designer",
    href: null,
    name: "Kit Designer",
    blurb:
      "Stripe, sash, panel and trim composer for jersey/shorts/socks — exports to the in-game palette format.",
    status: "queued",
    category: "Visual",
  },
  {
    no: "07",
    slug: "scout-report",
    href: null,
    name: "Scout Report Composer",
    blurb:
      "Templated scouting blurbs with attribute-aware language — writes flavour copy for the youth intake screen.",
    status: "queued",
    category: "Narrative",
  },
];
