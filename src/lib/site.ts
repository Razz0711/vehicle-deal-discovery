/**
 * Brand configuration. The name is temporary: change it here and it changes
 * everywhere. No domain is referenced anywhere in the application.
 */
export const SITE = {
  name: "DealFinder",
  tagline: "Your Next Vehicle. Your Best Deal.",
  description:
    "Compare prices, explore offers across India, and find the right vehicle, all in one place.",
  /** Public contact address. Leave empty until one exists; the Contact page adapts. */
  contactEmail: "",
  /** Social profile links, e.g. { label: "Instagram", href: "https://…" }. Empty until real ones exist. */
  social: [] as { label: string; href: string }[],
} as const;
