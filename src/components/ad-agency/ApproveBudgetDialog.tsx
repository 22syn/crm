import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApproveBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  budgetRequired: number;
  onConfirm: (budgetApproved: number) => void;
  isPending?: boolean;
}

/** Dialog shown when approving a draft project — set budget_approved (default = budget_required). */
export function ApproveBudgetDialog({
  open,
  onOpenChange,
  projectTitle,
  budgetRequired,
  onConfirm,
  isPending = false,
}: ApproveBudgetDialogProps) {
  const [value, setValue] = useState(String(budgetRequired || 0));

  useEffect(() => {
    if (open) {
      setValue(String(budgetRequired || 0));
    }
  }, [open, budgetRequired]);

  const handleConfirm = () => {
    const num = Number(value);
    if (!Number.isNaN(num) && num >= 0) {
      onConfirm(num);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>אישור תקציב</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          הפרויקט &quot;{projectTitle}&quot; מאושר. הזן את התקציב שאושר:
        </p>
        <div className="space-y-2">
          <Label htmlFor="budget_approved">תקציב שאושר</Label>
          <Input
            id="budget_approved"
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="כפי שנדרש או סכום שונה"
          />
          <p className="text-xs text-muted-foreground">
            תקציב נדרש: ₪{Number(budgetRequired || 0).toLocaleString("he-IL")}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            ביטול
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "שומר..." : "אשר"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
