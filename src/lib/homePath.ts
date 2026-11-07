import type { Module } from "@/contexts/AuthContext";

export interface ModuleAccess {
  readonly canAccessModule: (module: Module) => boolean;
  readonly isModuleAdmin: (module: Module) => boolean;
}

/**
 * The first page this user is allowed to open, or undefined when there is none
 * (e.g. no roles at all, or only a `system/user` role, which opens no page).
 */
export function getHomePath({ canAccessModule, isModuleAdmin }: ModuleAccess): string | undefined {
  if (canAccessModule("leads")) return "/dashboard";
  if (canAccessModule("ad_agency")) return "/ad-agency";
  if (isModuleAdmin("system")) return "/settings";
  return undefined;
}
