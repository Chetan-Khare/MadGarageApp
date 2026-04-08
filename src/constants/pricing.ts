/**
 * Centralized pricing constants for the MadGarage application.
 *
 * P2 FIX: Magic numbers extracted from components and stores into
 * this single source of truth. When business rules change (e.g., the
 * garage discount changes from 5% to 8%), this is the only file to update.
 *
 * Note: The backend mirrors these values in application.yml under app.pricing.
 */
export const PRICING = {
  /** Multiplier applied to the base price for GARAGE role customers (5% discount). */
  GARAGE_DISCOUNT_MULTIPLIER: 0.95,

  /** Standard shipping fee applied at checkout (INR). */
  SHIPPING_FEE: 250,
} as const;
