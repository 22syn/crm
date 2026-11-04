import { describe, it, expect } from "vitest";
import { getAreaModule, getDirection, getLanguage, isAppLanguage } from "../locale";

describe("getDirection", () => {
  it("is right-to-left for Hebrew and left-to-right for English", () => {
    expect(getDirection("he")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
  });
});

describe("getLanguage", () => {
  it("uses the stored language", () => {
    expect(getLanguage("he", "leads")).toBe("he");
    expect(getLanguage("en", "ad_agency")).toBe("en");
  });
  it("keeps today's behavior when the column is missing or invalid", () => {
    expect(getLanguage(undefined, "ad_agency")).toBe("he");
    expect(getLanguage(undefined, "leads")).toBe("en");
    expect(getLanguage("fr", "ad_agency")).toBe("he");
  });
  it("falls back to English without a module", () => {
    expect(getLanguage(undefined, undefined)).toBe("en");
  });
});

describe("isAppLanguage", () => {
  it("accepts only supported languages", () => {
    expect(isAppLanguage("he")).toBe(true);
    expect(isAppLanguage("HE")).toBe(false);
    expect(isAppLanguage(null)).toBe(false);
  });
});

describe("getAreaModule", () => {
  it("uses ad_agency inside the ad agency area", () => {
    expect(getAreaModule("/ad-agency", "leads")).toBe("ad_agency");
    expect(getAreaModule("/ad-agency/projects/p1", "leads")).toBe("ad_agency");
  });
  it("uses the user's module elsewhere", () => {
    expect(getAreaModule("/dashboard", "leads")).toBe("leads");
    expect(getAreaModule("/ad-agency-old", "leads")).toBe("leads");
    expect(getAreaModule("/settings", undefined)).toBeUndefined();
  });
});
