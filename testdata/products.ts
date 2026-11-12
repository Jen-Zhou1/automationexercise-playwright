/**
 * testdata/products.ts
 * Product IDs, names and prices must match the live site.
 */
export interface SearchScenario {
  keyword: string;
  /** Search results should contain this product name */
  expectContains: string[];
  /** Minimum number of results after the search */
  minResults: number;
}

/** Data-driven product search (tests/02-catalog.spec.ts) */
export const SEARCH_SCENARIOS: SearchScenario[] = [
  { keyword: 'Blue', expectContains: ['Blue Top'], minResults: 1 },
  { keyword: 'Dress', expectContains: [], minResults: 1 },
  { keyword: 'tshirt', expectContains: [], minResults: 1 },
];

export interface CartProduct {
  id: string;
  name: string;
  unitPrice: number; // Rs.
}

/** Products that exist on the site. */
export const PRODUCTS = {
  blueTop: { id: '1', name: 'Blue Top', unitPrice: 500 },
  menTshirt: { id: '2', name: 'Men Tshirt', unitPrice: 400 },
  sleevelessDress: { id: '3', name: 'Sleeveless Dress', unitPrice: 1000 },
} satisfies Record<string, CartProduct>;

/** Add to cart from the product detail page (tests/03-cart.spec.ts) */
export const PRODUCT_DETAIL_SCENARIO = {
  product: PRODUCTS.blueTop,
  quantity: 4,
  expectedLineTotal: 2000, // 500 x 4
};

/**
 * Product-detail attributes that need an exact match. Verified against the live
 * DOM of /product_details/1 (`Category: Women > Tops`, `Brand: Polo`).
 * Kept as a separate non-optional constant instead of being folded into
 * PRODUCTS: a missing value would degrade the assertion into
 * `toContainText('undefined')`, whereas here a missing value is a compile error.
 */
export const BLUE_TOP_DETAILS = {
  category: 'Women > Tops',
  brand: 'Polo',
} as const;
