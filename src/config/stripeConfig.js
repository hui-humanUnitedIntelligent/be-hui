// src/config/stripeConfig.js
// HUI Stripe Konfiguration — Produkt & Preis IDs
// ARCH-006.1: Single Source of Truth — alle IDs hier zentralisiert
// NICHT selbst berechnen — immer via RPC an Supabase/Stripe delegieren

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export const HUI_PRODUCTS = {
  "work": "prod_UnyiGqQftc4RpP",
  "talent": "prod_UnyiNG1tGwXtRQ",
  "donation": "prod_UnyiD02DBBsTR4",
  "subscription": "prod_UnyimFGTzrcj64",
  "impact_subscription": "prod_UnyiCUJRVxIYZD"
};

export const HUI_PRICES = {
  "work": "price_1ToMkiQygHtJtH5iE5m6CiTq",
  "talent": "price_1ToMkjQygHtJtH5iI7bhlVat",
  "donation": "price_1ToMkjQygHtJtH5iDAEa7NF9",
  "subscription": "price_1ToMkjQygHtJtH5i68mBnGdz",
  "impact_subscription": "price_1ToMkjQygHtJtH5i3HeK9PJJ"
};

// Checkout-Typen
export const CHECKOUT_TYPES = {
  WORK:               'work',
  TALENT:             'talent',
  DONATION:           'donation',
  SUBSCRIPTION:       'subscription',
  IMPACT_SUBSCRIPTION:'impact_subscription',
};

// Mindestbeträge in Cent
export const MIN_AMOUNTS = {
  work:               100,   // 1 EUR
  talent:             500,   // 5 EUR
  donation:           100,   // 1 EUR
  subscription:       999,   // 9,99 EUR/mo
  impact_subscription:999,   // 9,99 EUR/mo
};

// Success/Cancel URLs
export const CHECKOUT_URLS = {
  success: `${import.meta.env.VITE_APP_URL || 'https://be-hui.com'}/checkout/success`,
  cancel:  `${import.meta.env.VITE_APP_URL || 'https://be-hui.com'}/checkout/cancel`,
};
