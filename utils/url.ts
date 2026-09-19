/**
 * Every path the suite navigates to, in one place.
 *
 * Tests never type a path. When the application renames a route the change is
 * one line here rather than a grep across forty files, and a route that no test
 * uses is visible as an unused export rather than hiding in a string literal.
 */
export const Path = {
  home: '/',
  products: '/products',
  productDetails: (id: number) => `/product_details/${id}`,
  categoryProducts: (id: number) => `/category_products/${id}`,
  brandProducts: (brand: string) => `/brand_products/${brand}`,
  cart: '/view_cart',
  login: '/login',
  logout: '/logout',
  deleteAccount: '/delete_account',
  contact: '/contact_us',
  testCases: '/test_cases',
  apiList: '/api_list',
} as const;

/** Page titles the application sets, asserted on navigation. */
export const Title = {
  home: 'Automation Exercise',
  products: 'Automation Exercise - All Products',
  productDetails: 'Automation Exercise - Product Details',
  cart: 'Automation Exercise - Checkout',
  login: 'Automation Exercise - Signup / Login',
  contact: 'Automation Exercise - Contact Us',
  testCases: 'Automation Exercise - Test Cases',
} as const;
