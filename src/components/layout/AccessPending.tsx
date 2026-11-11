import { useAuth } from "@/contexts/AuthContext";
import { useLoginBranding } from "@/hooks/useAppBranding";
import { getShellCopy } from "@/lib/shellCopy";
import { Button } from "@/components/ui/button";
import { AppDirection } from "./AppDirection";

/**
 * Shown when a signed-in user has no page they are allowed to open. Such a user has no module,
 * so the screen follows the deployment's login-page language, like the sign-in screen before it.
 */
export function AccessPending() {
  const { signOut } = useAuth();
  const { language } = useLoginBranding();
  const copy = getShellCopy(language);
  return (
    <AppDirection language={language}>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-display font-semibold">{copy.accessPendingTitle}</h1>
          <p className="text-muted-foreground">{copy.accessPendingBody}</p>
          <Button variant="outline" onClick={() => void signOut()}>
            {copy.signOut}
          </Button>
        </div>
      </div>
    </AppDirection>
  );
}
