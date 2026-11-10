import type { AppLanguage } from "@/lib/locale";

/** Text of the app frame around every page: header and breadcrumb. */
export interface ShellCopy {
  readonly searchPlaceholder: string;
  readonly notifications: string;
  readonly logout: string;
  readonly dashboard: string;
}

const ShellCopyByLanguage: Readonly<Record<AppLanguage, ShellCopy>> = {
  en: {
    searchPlaceholder: "Search leads, contacts, deals...",
    notifications: "Notifications",
    logout: "Logout",
    dashboard: "Dashboard",
  },
  he: {
    searchPlaceholder: "חיפוש...",
    notifications: "התראות",
    logout: "התנתקות",
    dashboard: "דשבורד",
  },
};

export function getShellCopy(language: AppLanguage): ShellCopy {
  return ShellCopyByLanguage[language];
}
