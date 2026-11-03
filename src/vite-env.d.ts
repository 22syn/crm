/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_STORE_DOMAIN?: string;
  readonly VITE_SHOPIFY_STOREFRONT_TOKEN?: string;
  /** Module whose branding the login page shows: "leads" or "ad_agency". Unset: Xsheva defaults. */
  readonly VITE_BRAND_MODULE?: string;
}
