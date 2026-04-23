/**
 * Centralized pricing constants for the MadGarage application.
 *
 * NOTE: The garage discount is now a DYNAMIC TIERED SYSTEM managed via
 * system_settings in the database. The multiplier below is only used as
 * a local fallback if the API is unreachable. The actual discount is
 * calculated server-side based on the product's price tier and wholesale flag.
 *
 * Tier configuration (editable by Admin in Settings):
 *   LOW:  Products below MID_THRESHOLD  (default 5%)
 *   MID:  Products MID–HIGH threshold   (default 3%)
 *   HIGH: Products above HIGH_THRESHOLD  (default 1%)
 */
export const PRICING = {
  /** Fallback multiplier (5% discount). Real value is fetched from the API. */
  GARAGE_DISCOUNT_MULTIPLIER: 0.95,

  /** Standard shipping fee applied at checkout (INR). */
  SHIPPING_FEE: 250,
} as const;
