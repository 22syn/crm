import { describe, expect, it } from "vitest";
import type { Module, ModuleRole } from "@/contexts/AuthContext";
import { getHomePath } from "../homePath";

function access(roles: Partial<Record<Module, ModuleRole>>, superAdmin = false) {
  return {
    canAccessModule: (m: Module) => superAdmin || m in roles,
    isModuleAdmin: (m: Module) => superAdmin || roles[m] === "admin",
  };
}

describe("getHomePath", () => {
  it("sends leads users to the dashboard", () => {
    expect(getHomePath(access({ leads: "user" }))).toBe("/dashboard");
  });
  it("sends ad-agency-only users to the agency area", () => {
    expect(getHomePath(access({ ad_agency: "user" }))).toBe("/ad-agency");
  });
  it("sends system admins to settings", () => {
    expect(getHomePath(access({ system: "admin" }))).toBe("/settings");
  });
  it("sends super admins to the dashboard", () => {
    expect(getHomePath(access({}, true))).toBe("/dashboard");
  });
  it("has no page for a system/user-only account", () => {
    expect(getHomePath(access({ system: "user" }))).toBeUndefined();
  });
  it("has no page for a user with no roles", () => {
    expect(getHomePath(access({}))).toBeUndefined();
  });
});
