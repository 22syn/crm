/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_STORE_DOMAIN?: string;
  readonly VITE_SHOPIFY_STOREFRONT_TOKEN?: string;
  /** Module whose branding the login page shows: "leads" (default) or "ad_agency". */
  readonly VITE_BRAND_MODULE?: string;
}
