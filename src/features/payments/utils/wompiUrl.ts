import type { WompiWidgetData } from "../types/payment.types";

export function buildWompiCheckoutUrl(
  data: WompiWidgetData,
  redirectUrl?: string,
): string {
  const params = new URLSearchParams({
    "public-key": data.publicKey,
    currency: data.currency,
    "amount-in-cents": String(data.amountInCents),
    reference: data.reference,
    "signature:integrity": data.integritySignature,
  });
  if (redirectUrl) params.set("redirect-url", redirectUrl);
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}
