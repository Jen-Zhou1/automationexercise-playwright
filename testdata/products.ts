/**
 * testdata/products.ts
 * Product's ID and name should match with test site
 */
export interface SearchScenario {
  keyword: string;
  /** Search results should contain product name */
  expectContains: string[];
  /** Return min. count after product search */
  minResults: number;
}

/** Data-driven products search（03-search-cart-and-persistence.spec.ts Checkout） */
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

/** Existed Products */
export const PRODUCTS = {
  blueTop: { id: '1', name: 'Blue Top', unitPrice: 500 },
  menTshirt: { id: '2', name: 'Men Tshirt', unitPrice: 400 },
  sleevelessDress: { id: '3', name: 'Sleeveless Dress', unitPrice: 1000 },
} satisfies Record<string, CartProduct>;

/** Add to Cart on PDP（04-product-detail-review-and-cart-actions.spec.ts Checkout） */
export const PRODUCT_DETAIL_SCENARIO = {
  product: PRODUCTS.blueTop,
  quantity: 4,
  expectedLineTotal: 2000, // 500 × 4
};
