import type { AppLanguage } from "@/lib/locale";

/** Text of the app frame around every page: header, sidebar, breadcrumb, theme menu, command palette. */
export interface ShellCopy {
  readonly searchPlaceholder: string;
  readonly notifications: string;
  readonly logout: string;
  readonly dashboard: string;
  readonly userFallback: string;
  readonly logoAlt: (brandName: string) => string;
  readonly theme: string;
  readonly themeLight: string;
  readonly themeDark: string;
  readonly themeSystem: string;
  readonly adminGroup: string;
  readonly automations: string;
  readonly settings: string;
  readonly paletteNavigate: string;
  readonly paletteSearch: string;
  readonly paletteSearching: string;
  readonly paletteNoResults: string;
  readonly paletteNavigateHint: string;
  readonly accessPendingTitle: string;
  readonly accessPendingBody: string;
  readonly signOut: string;
}

const ShellCopyByLanguage: Readonly<Record<AppLanguage, ShellCopy>> = {
  en: {
    searchPlaceholder: "Search leads, contacts, deals...",
    notifications: "Notifications",
    logout: "Logout",
    dashboard: "Dashboard",
    userFallback: "User",
    logoAlt: (brandName) => `${brandName} logo`,
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    adminGroup: "Admin",
    automations: "Automations",
    settings: "Settings",
    paletteNavigate: "Navigate...",
    paletteSearch: "Search...",
    paletteSearching: "Searching...",
    paletteNoResults: "No results.",
    paletteNavigateHint: "Navigate using the menu above.",
    accessPendingTitle: "Access Pending",
    accessPendingBody:
      "Your account has been created but you don't have CRM access yet. Please contact an administrator to get your role assigned.",
    signOut: "Sign out",
  },
  he: {
    searchPlaceholder: "חיפוש...",
    notifications: "התראות",
    logout: "התנתקות",
    dashboard: "דשבורד",
    userFallback: "משתמש",
    logoAlt: (brandName) => `הלוגו של ${brandName}`,
    theme: "ערכת צבעים",
    themeLight: "בהירה",
    themeDark: "כהה",
    themeSystem: "לפי המערכת",
    adminGroup: "ניהול",
    automations: "אוטומציות",
    settings: "הגדרות",
    paletteNavigate: "לאן לעבור?",
    paletteSearch: "חיפוש...",
    paletteSearching: "מחפש...",
    paletteNoResults: "לא נמצאו תוצאות.",
    paletteNavigateHint: "בחרו יעד מהרשימה למעלה.",
    accessPendingTitle: "הגישה ממתינה לאישור",
    accessPendingBody: "החשבון שלכם נוצר, אבל עדיין אין לכם גישה למערכת. פנו למנהל המערכת כדי לקבל הרשאה.",
    signOut: "התנתקות",
  },
};

export function getShellCopy(language: AppLanguage): ShellCopy {
  return ShellCopyByLanguage[language];
}
