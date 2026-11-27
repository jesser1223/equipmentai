import Stripe from "stripe";
export { assistantEntitlementUpdate, billingAccess } from "@/lib/entitlement";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil" as any,
  typescript: true,
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
