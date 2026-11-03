import { describe, it, expect } from "vitest";
import { isFeatureEnabled, normalizeFeatures, parseFeaturesJson } from "../featureFlags";

describe("isFeatureEnabled", () => {
  it("is true only for a flag set to boolean true", () => {
    const flags = normalizeFeatures({ quotes: true, shopify: false });
    expect(isFeatureEnabled(flags, "quotes")).toBe(true);
    expect(isFeatureEnabled(flags, "shopify")).toBe(false);
  });
  it("is false for missing flags and missing settings", () => {
    expect(isFeatureEnabled({}, "quotes")).toBe(false);
    expect(isFeatureEnabled(undefined, "quotes")).toBe(false);
  });
  it("does not treat truthy non-booleans as enabled", () => {
    const flags = normalizeFeatures({ quotes: "true", shopify: 1 });
    expect(isFeatureEnabled(flags, "quotes")).toBe(false);
    expect(isFeatureEnabled(flags, "shopify")).toBe(false);
  });
});

describe("normalizeFeatures", () => {
  it("keeps boolean entries and drops the rest", () => {
    expect(normalizeFeatures({ a: true, b: false, c: "yes", d: null })).toEqual({ a: true, b: false });
  });
  it("returns no flags for non-object input", () => {
    expect(normalizeFeatures(null)).toEqual({});
    expect(normalizeFeatures(undefined)).toEqual({});
    expect(normalizeFeatures([true])).toEqual({});
    expect(normalizeFeatures("quotes")).toEqual({});
  });
});

describe("parseFeaturesJson", () => {
  it("parses an object of booleans", () => {
    expect(parseFeaturesJson('{"quotes": true, "shopify": false}')).toEqual({ quotes: true, shopify: false });
  });
  it("treats blank input as no flags", () => {
    expect(parseFeaturesJson("   ")).toEqual({});
  });
  it("rejects non-object JSON", () => {
    expect(() => parseFeaturesJson("[true]")).toThrow("must be a JSON object");
    expect(() => parseFeaturesJson("true")).toThrow("must be a JSON object");
  });
  it("rejects non-boolean values and names the flag", () => {
    expect(() => parseFeaturesJson('{"quotes": "yes"}')).toThrow('"quotes" must be true or false');
  });
  it("rejects invalid JSON", () => {
    expect(() => parseFeaturesJson("{quotes: true}")).toThrow();
  });
});
