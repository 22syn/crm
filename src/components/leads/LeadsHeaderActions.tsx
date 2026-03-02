import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface LeadsHeaderActionsProps {
  onAddDemoLeads: () => void;
  isPending: boolean;
}

export function LeadsHeaderActions({ onAddDemoLeads, isPending }: LeadsHeaderActionsProps) {
  return (
    <Button
      variant="outline"
      className="rounded-sm shrink-0 text-sm"
      onClick={onAddDemoLeads}
      disabled={isPending}
    >
      <Sparkles className="h-4 w-4 mr-2 shrink-0" />
      <span className="hidden sm:inline">{isPending ? "Adding…" : "Add 50 demo leads"}</span>
      <span className="sm:hidden">{isPending ? "…" : "Demo"}</span>
    </Button>
  );
}
