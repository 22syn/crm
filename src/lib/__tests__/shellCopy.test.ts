import { describe, it, expect } from "vitest";
import { getShellCopy } from "../shellCopy";
import { APP_LANGUAGES } from "../locale";

const HEBREW_LETTER = /[א-ת]/;
const LATIN_LETTER = /[A-Za-z]/;

describe("getShellCopy", () => {
  it.each(APP_LANGUAGES)("has every frame text filled in for %s", (language) => {
    for (const [key, value] of Object.entries(getShellCopy(language))) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("keeps the English frame text as it was", () => {
    expect(getShellCopy("en").searchPlaceholder).toBe("Search leads, contacts, deals...");
    expect(getShellCopy("en").dashboard).toBe("Dashboard");
  });

  it("writes the Hebrew frame text in Hebrew only", () => {
    for (const value of Object.values(getShellCopy("he"))) {
      expect(value).toMatch(HEBREW_LETTER);
      expect(value).not.toMatch(LATIN_LETTER);
    }
  });
});
