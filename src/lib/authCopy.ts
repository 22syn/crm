import type { AppLanguage } from "@/lib/locale";

export interface AuthCopy {
  readonly welcomeTitle: string;
  readonly intro: (brandName: string) => string;
  readonly emailLabel: string;
  readonly emailPlaceholder: string;
  readonly passwordLabel: string;
  readonly passwordPlaceholder: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly signIn: string;
  readonly signedIn: string;
  readonly noAccount: string;
  readonly contactSales: string;
  readonly heroTitle: string;
  readonly heroBody: (brandName: string) => string;
  readonly rights: (year: number, brandName: string) => string;
  readonly logoAlt: (brandName: string) => string;
}

const AuthCopyByLanguage: Readonly<Record<AppLanguage, AuthCopy>> = {
  en: {
    welcomeTitle: "Welcome back",
    intro: (brandName) => `Please enter your details to sign in to your ${brandName} account.`,
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your email address",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signIn: "Sign In",
    signedIn: "Welcome back!",
    noAccount: "Don't have an account?",
    contactSales: "Contact Sales",
    heroTitle: "The future of CRM is here.",
    heroBody: (brandName) =>
      `Streamline your sales process, manage customer relationships, and scale your business with ${brandName}'s intelligent platform.`,
    rights: (year, brandName) => `© ${year} ${brandName}. All rights reserved.`,
    logoAlt: (brandName) => `${brandName} logo`,
  },
  he: {
    welcomeTitle: "ברוכים השבים",
    intro: (brandName) => `הזינו את הפרטים שלכם כדי להתחבר לחשבון ${brandName}.`,
    emailLabel: "כתובת אימייל",
    emailPlaceholder: "הזינו את כתובת האימייל שלכם",
    passwordLabel: "סיסמה",
    passwordPlaceholder: "הזינו את הסיסמה שלכם",
    showPassword: "הצגת הסיסמה",
    hidePassword: "הסתרת הסיסמה",
    signIn: "כניסה",
    signedIn: "ברוכים השבים!",
    noAccount: "אין לכם חשבון?",
    contactSales: "צרו קשר",
    heroTitle: "ניהול הלקוחות של העתיד כבר כאן.",
    heroBody: (brandName) =>
      `ייעלו את תהליך המכירה, נהלו את הקשר עם הלקוחות והגדילו את העסק עם הפלטפורמה החכמה של ${brandName}.`,
    rights: (year, brandName) => `© ${year} ${brandName}. כל הזכויות שמורות.`,
    logoAlt: (brandName) => `הלוגו של ${brandName}`,
  },
};

export function getAuthCopy(language: AppLanguage): AuthCopy {
  return AuthCopyByLanguage[language];
}
