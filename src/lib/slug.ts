export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatINR(amount: number): string {
  return "₹ " + Math.round(amount).toLocaleString("en-IN");
}
