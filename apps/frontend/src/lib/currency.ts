/**
 * Formats a numeric amount into Bangladeshi Taka (BDT) currency representation.
 * Example: 1250 -> "৳1,250"
 */
export function formatBDT(amount: number | string): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return "৳0";
  }

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(numericAmount)
    .replace("BDT", "৳")
    .trim();
}
