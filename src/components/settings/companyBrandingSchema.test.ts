import { describe, it, expect } from "vitest";
import { companyBrandingSchema, getBrandingFormValues, getBrandingUpdate } from "./companyBrandingSchema";

const EMPTY_VALUES = { name: "", logoUrl: "", primaryColor: "", senderEmail: "", language: "en" as const, featuresJson: "" };

describe("getBrandingUpdate", () => {
  it("turns empty fields into null so the defaults apply again", () => {
    expect(getBrandingUpdate(EMPTY_VALUES, { canEditFeatures: false })).toEqual({
      name: null,
      logo_url: null,
      primary_color: null,
      sender_email: null,
      language: "en",
    });
  });
  it("sends features only when the editor may change them", () => {
    const values = { ...EMPTY_VALUES, name: " Acme ", featuresJson: '{"quotes": true}' };
    expect(getBrandingUpdate(values, { canEditFeatures: false })).not.toHaveProperty("features");
    expect(getBrandingUpdate(values, { canEditFeatures: true })).toMatchObject({
      name: "Acme",
      features: { quotes: true },
    });
  });
});

describe("getBrandingFormValues", () => {
  it("returns empty fields when there is no settings row", () => {
    expect(getBrandingFormValues(null)).toEqual(EMPTY_VALUES);
  });
  it("shows today's language for a row saved before the language column existed", () => {
    const legacyRow = { module: "ad_agency", name: "הר סיני", features: {} } as unknown as Parameters<typeof getBrandingFormValues>[0];
    expect(getBrandingFormValues(legacyRow).language).toBe("he");
  });
});

describe("companyBrandingSchema", () => {
  it("accepts empty values and valid ones", () => {
    expect(companyBrandingSchema.safeParse(EMPTY_VALUES).success).toBe(true);
    const valid = {
      name: "Acme",
      logoUrl: "https://cdn.acme.com/logo.png",
      primaryColor: "#1337EC",
      senderEmail: "quotes@acme.com",
      language: "he",
      featuresJson: '{"quotes": true}',
    };
    expect(companyBrandingSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects unsafe logo URLs, bad colors, bad emails and bad flags", () => {
    for (const bad of [
      { logoUrl: "javascript:alert(1)" },
      { primaryColor: "blue" },
      { senderEmail: "not-an-email" },
      { featuresJson: '{"quotes": "yes"}' },
    ]) {
      expect(companyBrandingSchema.safeParse({ ...EMPTY_VALUES, ...bad }).success).toBe(false);
    }
  });
});
