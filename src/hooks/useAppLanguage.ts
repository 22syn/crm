import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { type CompanyModule, getUserBrandModule } from "@/lib/branding";
import { type AppLanguage, getAreaModule, getDirection, getLanguage, type TextDirection } from "@/lib/locale";

interface LanguageState {
  readonly language: AppLanguage;
  readonly isLoading: boolean;
}

/** Language of the area being viewed: the ad agency area has its own, everything else follows the user's module. */
export function useAreaLanguage(): LanguageState {
  const { pathname } = useLocation();
  const { canAccessModule } = useAuth();
  const module = getAreaModule(pathname, getUserBrandModule(canAccessModule));
  const { data, isLoading } = useCompanySettings(module);
  return { language: getLanguage(data?.language, module), isLoading };
}

/** Direction of one module's own content, e.g. its menu group when several modules share the sidebar. */
export function useModuleDirection(module: CompanyModule | undefined): TextDirection | undefined {
  const { data } = useCompanySettings(module);
  return module ? getDirection(getLanguage(data?.language, module)) : undefined;
}
