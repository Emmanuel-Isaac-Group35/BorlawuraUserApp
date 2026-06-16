// ─────────────────────────────────────────────────────────────────────────────
// Pricing — single source of truth for all waste collection prices
// ─────────────────────────────────────────────────────────────────────────────

export interface PriceTier {
  id: string;
  label: string;
  description: string;
  price: number;   // GHS
  icon: string;
}

export const PRICE_TABLE: Record<string, number> = {
  small:  7,
  medium: 13,
  large:  25,
  xl:     150,
};

export const PRICE_TIERS: PriceTier[] = [
  { id: 'small',  label: 'Small',       description: '1 – 2 Bags',   price: 7,   icon: 'ri-shopping-bag-3-fill' },
  { id: 'medium', label: 'Medium',      description: '3 – 5 Bags',   price: 13,  icon: 'ri-handbag-fill' },
  { id: 'large',  label: 'Large',       description: '6+ / Sacks',   price: 25,  icon: 'ri-archive-fill' },
  { id: 'xl',     label: 'Extra Large', description: 'Truck Load',   price: 150, icon: 'ri-truck-fill' },
];

/**
 * Calculate the total order price for a given bag size.
 * Returns 0 if the bag size is unknown.
 */
export const calculateOrderPrice = (bagSize: string): number => {
  return PRICE_TABLE[bagSize] ?? 0;
};

/**
 * Format a price as a display string: "GHS 7.00"
 */
export const formatPrice = (amount: number): string => {
  return `GHS ${amount.toFixed(2)}`;
};
