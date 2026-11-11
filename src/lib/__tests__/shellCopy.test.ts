import { describe, it, expect } from "vitest";
import { getShellCopy, type ShellCopy } from "../shellCopy";
import { APP_LANGUAGES, type AppLanguage } from "../locale";

const HEBREW_LETTER = /[א-ת]/;
const LATIN_LETTER = /[A-Za-z]/;
const SAMPLE_BRAND = "הר סיני הפקות";

function renderedTexts(language: AppLanguage): ReadonlyArray<[keyof ShellCopy, string]> {
  return Object.entries(getShellCopy(language)).map(([key, value]) => [
    key as keyof ShellCopy, // Object.entries widens keys to string
    typeof value === "function" ? value(SAMPLE_BRAND) : value,
  ]);
}

describe("getShellCopy", () => {
  it.each(APP_LANGUAGES)("has every frame text filled in for %s", (language) => {
    for (const [key, text] of renderedTexts(language)) {
      expect(text.trim(), key).not.toBe("");
    }
  });

  it("keeps the English frame text as it was", () => {
    const en = getShellCopy("en");
    expect(en.searchPlaceholder).toBe("Search leads, contacts, deals...");
    expect(en.dashboard).toBe("Dashboard");
    expect(en.adminGroup).toBe("Admin");
    expect(en.settings).toBe("Settings");
    expect(en.accessPendingTitle).toBe("Access Pending");
    expect(en.logoAlt("Acme")).toBe("Acme logo");
  });

  it("writes the Hebrew frame text in Hebrew only", () => {
    for (const [key, text] of renderedTexts("he")) {
      expect(text, key).toMatch(HEBREW_LETTER);
      expect(text, key).not.toMatch(LATIN_LETTER);
    }
  });
});
