import { describe, it, expect } from "vitest";
import { getAuthCopy, getSignInErrorMessage } from "../authCopy";
import { APP_LANGUAGES } from "../locale";

const HEBREW_LETTER = /[א-ת]/;
const LATIN_LETTER = /[A-Za-z]/;

describe("getAuthCopy", () => {
  it.each(APP_LANGUAGES)("has every login text filled in for %s", (language) => {
    const copy = getAuthCopy(language);
    for (const [key, value] of Object.entries(copy)) {
      const text = typeof value === "function" ? value(2026, "Brand") : value;
      expect(String(text).trim(), key).not.toBe("");
    }
  });

  it("keeps the English login text as it was", () => {
    const en = getAuthCopy("en");
    expect(en.welcomeTitle).toBe("Welcome back");
    expect(en.signIn).toBe("Sign In");
    expect(en.intro("Acme")).toBe("Please enter your details to sign in to your Acme account.");
  });

  it("writes the Hebrew login text in Hebrew, with the brand name inserted", () => {
    const he = getAuthCopy("he");
    const strings = [he.welcomeTitle, he.emailLabel, he.passwordLabel, he.signIn, he.heroTitle];
    for (const text of strings) {
      expect(text).toMatch(HEBREW_LETTER);
      expect(text).not.toMatch(LATIN_LETTER);
    }
    expect(he.intro("הר סיני הפקות")).toContain("הר סיני הפקות");
    expect(he.rights(2026, "הר סיני הפקות")).toBe("© 2026 הר סיני הפקות. כל הזכויות שמורות.");
  });
});

describe("getSignInErrorMessage", () => {
  const wrongPassword = { code: "invalid_credentials", message: "Invalid login credentials" };

  it("keeps Supabase's own message in English", () => {
    expect(getSignInErrorMessage("en", wrongPassword)).toBe("Invalid login credentials");
  });

  it("maps known sign-in errors to Hebrew", () => {
    expect(getSignInErrorMessage("he", wrongPassword)).toBe("האימייל או הסיסמה שגויים.");
    expect(getSignInErrorMessage("he", { code: "email_not_confirmed", message: "Email not confirmed" })).toMatch(
      /אומתה/
    );
  });

  it("never shows raw English to a Hebrew user, even for unknown or missing codes", () => {
    for (const error of [{ code: "something_new", message: "Something new" }, { message: "No code at all" }]) {
      const text = getSignInErrorMessage("he", error);
      expect(text).toMatch(/[א-ת]/);
      expect(text).not.toMatch(/[A-Za-z]/);
    }
  });
});
