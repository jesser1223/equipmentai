const INPUT_PER_MILLION = Number(process.env.GROK_INPUT_USD_PER_MILLION || "1.25");
const OUTPUT_PER_MILLION = Number(process.env.GROK_OUTPUT_USD_PER_MILLION || "2.50");

export function estimatedCostUsd(inputTokens: number, outputTokens: number) {
  return (inputTokens / 1_000_000) * INPUT_PER_MILLION + (outputTokens / 1_000_000) * OUTPUT_PER_MILLION;
}

export function monthlyLimit(isTrial: boolean) {
  const trial = Number(process.env.GROK_TRIAL_TOKEN_LIMIT || "200000");
  const paid = Number(process.env.GROK_PAID_TOKEN_LIMIT || "2000000");
  return isTrial ? trial : paid;
}

export function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
