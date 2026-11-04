import { useEffect, type ReactNode } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { type AppLanguage, getDirection } from "@/lib/locale";

interface AppDirectionProps {
  readonly language: AppLanguage;
  readonly children: ReactNode;
}

/**
 * Applies the client's language to the whole document (so portaled dialogs and menus follow it too)
 * and to Radix components, which read direction from their provider rather than from the DOM.
 */
export function AppDirection({ language, children }: AppDirectionProps) {
  const dir = getDirection(language);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = dir;
  }, [language, dir]);

  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}
