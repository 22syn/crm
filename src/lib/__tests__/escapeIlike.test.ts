import { describe, it, expect } from "vitest";
import { escapeIlike } from "../escapeIlike";

describe("escapeIlike", () => {
  it("escapes % and _", () => {
    expect(escapeIlike("50%")).toBe("50\\%");
    expect(escapeIlike("a_b")).toBe("a\\_b");
  });
  it("escapes \\", () => {
    expect(escapeIlike("a\\b")).toBe("a\\\\b");
  });
  it("returns empty string for empty input", () => {
    expect(escapeIlike("")).toBe("");
  });
});
