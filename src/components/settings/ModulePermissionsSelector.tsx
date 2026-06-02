import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Module, ModuleRole } from "@/contexts/AuthContext";

const MODULE_CONFIG: Record<Module, { label: string; hasUser: boolean }> = {
  leads: { label: "Hadarya", hasUser: true },
  ad_agency: { label: "משרד פרסום", hasUser: true },
  system: { label: "הגדרות מערכת", hasUser: false },
};

export type ModulePermissions = Partial<Record<Module, ModuleRole>>;

interface ModulePermissionsSelectorProps {
  value: ModulePermissions;
  onChange: (v: ModulePermissions) => void;
  disabled?: boolean;
}

export function ModulePermissionsSelector({
  value,
  onChange,
  disabled,
}: ModulePermissionsSelectorProps) {
  const toggle = (module: Module, checked: boolean, role?: ModuleRole) => {
    const next = { ...value };
    if (checked) {
      next[module] = role ?? "user";
    } else {
      delete next[module];
    }
    onChange(next);
  };

  const setRole = (module: Module, role: ModuleRole) => {
    if (value[module]) onChange({ ...value, [module]: role });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {(["leads", "ad_agency", "system"] as const).map((module) => {
        const cfg = MODULE_CONFIG[module];
        const checked = module in value;
        return (
          <div key={module} className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`mod-${module}`}
                checked={checked}
                onCheckedChange={(c) => toggle(module, !!c)}
                disabled={disabled}
              />
              <Label htmlFor={`mod-${module}`} className="cursor-pointer font-medium">
                {cfg.label}
              </Label>
            </div>
            {checked && (
              <Select
                value={value[module] ?? "user"}
                onValueChange={(v) => setRole(module, v as ModuleRole)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  {cfg.hasUser && <SelectItem value="user">User</SelectItem>}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      })}
    </div>
  );
}
