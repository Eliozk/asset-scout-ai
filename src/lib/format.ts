import type { AssetPricing } from "@/domain/asset";

export function formatPricing(pricing: AssetPricing): string {
  if (pricing.model === "free") return "Free";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pricing.currency,
    minimumFractionDigits: pricing.amount % 1 === 0 ? 0 : 2,
  }).format(pricing.amount);
}
