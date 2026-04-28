import type { CreditInfo } from "./types.js";

export async function getApiCredit(): Promise<CreditInfo> {
  const apiKey = process.env.FISH_API_KEY;
  if (!apiKey) {
    return { credit: "unknown", has_free_credit: "unknown" };
  }

  try {
    const res = await fetch("https://api.fish.audio/wallet/self/api-credit?check_free_credit=true", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      return { credit: "unknown", has_free_credit: "unknown" };
    }

    const body = (await res.json()) as { credit?: unknown; has_free_credit?: unknown };
    return {
      credit: typeof body.credit === "string" ? body.credit : "unknown",
      has_free_credit: typeof body.has_free_credit === "boolean" ? body.has_free_credit : "unknown",
    };
  } catch {
    return { credit: "unknown", has_free_credit: "unknown" };
  }
}

export function formatCreditWarning(credit: CreditInfo): string | undefined {
  if (credit.credit === "unknown" || credit.has_free_credit === "unknown") {
    return "APIクレジット残高確認不可";
  }
  return undefined;
}
