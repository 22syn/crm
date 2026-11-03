import { describe, it, expect } from "vitest";
import {
  DEFAULT_BRAND_NAME,
  DEFAULT_LOGO_URL,
  getBranding,
  getLoginBrandModule,
  getUserBrandModule,
} from "../branding";

describe("getBranding", () => {
  it("falls back to Xsheva defaults when there is no settings row", () => {
    expect(getBranding(null)).toEqual({
      name: DEFAULT_BRAND_NAME,
      logoUrl: DEFAULT_LOGO_URL,
      primaryColor: undefined,
    });
    expect(DEFAULT_BRAND_NAME).toBe("Xsheva CRM");
  });
  it("falls back when fields are empty or missing (migration not applied)", () => {
    expect(getBranding({ name: "  ", logo_url: "" })).toEqual(getBranding(undefined));
    expect(getBranding({ name: "Acme" })).toEqual({
      name: "Acme",
      logoUrl: DEFAULT_LOGO_URL,
      primaryColor: undefined,
    });
  });
  it("uses configured values", () => {
    expect(
      getBranding({ name: "Acme CRM", logo_url: "https://cdn.acme.com/logo.png", primary_color: "#1337EC" })
    ).toEqual({ name: "Acme CRM", logoUrl: "https://cdn.acme.com/logo.png", primaryColor: "#1337EC" });
    expect(getBranding({ logo_url: "/brands/acme.png" }).logoUrl).toBe("/brands/acme.png");
  });
  it("ignores unsafe logo URLs and invalid colors", () => {
    expect(getBranding({ logo_url: "javascript:alert(1)" }).logoUrl).toBe(DEFAULT_LOGO_URL);
    expect(getBranding({ logo_url: "http://acme.com/logo.png" }).logoUrl).toBe(DEFAULT_LOGO_URL);
    expect(getBranding({ logo_url: "//evil.com/logo.png" }).logoUrl).toBe(DEFAULT_LOGO_URL);
    expect(getBranding({ primary_color: "red" }).primaryColor).toBeUndefined();
    expect(getBranding({ primary_color: "#fff" }).primaryColor).toBeUndefined();
  });
});

describe("getLoginBrandModule", () => {
  it("uses a known module from env", () => {
    expect(getLoginBrandModule("ad_agency")).toBe("ad_agency");
    expect(getLoginBrandModule("leads")).toBe("leads");
  });
  it("returns no module when unset or unknown, so a shared deployment shows defaults", () => {
    expect(getLoginBrandModule(undefined)).toBeUndefined();
    expect(getLoginBrandModule("")).toBeUndefined();
    expect(getLoginBrandModule("system")).toBeUndefined();
  });
});

describe("getUserBrandModule", () => {
  it("picks the first module the user can access", () => {
    expect(getUserBrandModule(() => true)).toBe("leads");
    expect(getUserBrandModule((m) => m === "ad_agency")).toBe("ad_agency");
    expect(getUserBrandModule(() => false)).toBeUndefined();
  });
});
