import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

/** Shown when a signed-in user has no page they are allowed to open. */
export function AccessPending() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-display font-semibold">Access Pending</h1>
        <p className="text-muted-foreground">
          Your account has been created but you don't have CRM access yet.
          Please contact an administrator to get your role assigned.
        </p>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
