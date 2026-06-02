import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Module, ModuleRole } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MembersTable } from "@/components/settings/MembersTable";
import { toast } from "sonner";
import { Loader2, UserPlus, ChevronRight } from "lucide-react";
import {
  ModulePermissionsSelector,
  type ModulePermissions,
} from "@/components/settings/ModulePermissionsSelector";

interface TeamMember {
  user_id: string;
  email: string | null;
  full_name: string | null;
  moduleRoles: Partial<Record<Module, ModuleRole>>;
}

function syncModuleRolesToDb(
  userId: string,
  permissions: ModulePermissions
): Promise<void> {
  return (async () => {
    const { error: delErr } = await supabase
      .from("user_module_roles")
      .delete()
      .eq("user_id", userId);
    if (delErr) throw delErr;

    const rows = Object.entries(permissions).map(([module, role]) => ({
      user_id: userId,
      module,
      role: role!,
    }));
    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from("user_module_roles")
        .insert(rows);
      if (insErr) throw insErr;
    }
  })();
}

export default function Settings() {
  const { superAdmin, isModuleAdmin } = useAuth();
  const canManageSettings = superAdmin || isModuleAdmin("system");
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPermissions, setNewUserPermissions] = useState<ModulePermissions>({
    leads: "user",
    ad_agency: "user",
  });
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [editPermissions, setEditPermissions] = useState<ModulePermissions>({});

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data: rows, error } = await supabase
        .from("user_module_roles")
        .select("user_id, module, role");

      if (error) throw error;

      const byUser = new Map<string, Partial<Record<Module, ModuleRole>>>();
      for (const r of rows ?? []) {
        const map = byUser.get(r.user_id) ?? {};
        map[r.module as Module] = r.role as ModuleRole;
        byUser.set(r.user_id, map);
      }

      const userIds = [...byUser.keys()];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      const profilesByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return userIds.map((user_id) => ({
        user_id,
        email: profilesByUserId.get(user_id)?.email ?? null,
        full_name: profilesByUserId.get(user_id)?.full_name ?? null,
        moduleRoles: byUser.get(user_id) ?? {},
      }));
    },
    enabled: canManageSettings,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({
      email,
      permissions,
    }: {
      email: string;
      permissions: ModulePermissions;
    }) => {
      if (Object.keys(permissions).length === 0) {
        throw new Error("Select at least one module");
      }
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        throw new Error("נא להתחבר מחדש – ההפעלה נדחתה (401)");
      }
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: email.trim(), permissions },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        if (error instanceof FunctionsHttpError && error.context?.status === 401) {
          throw new Error("פג תוקף ההתחברות – נא להתחבר מחדש");
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["crm-team"] });
      toast.success("ההזמנה נשלחה ל־" + vars.email);
      setNewUserEmail("");
      setNewUserPermissions({ leads: "user", ad_agency: "user" });
    },
    onError: (e) => toast.error(String(e instanceof Error ? e.message : e)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: ModulePermissions;
    }) => {
      await syncModuleRolesToDb(userId, permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("ההרשאות עודכנו");
      setEditingUser(null);
    },
    onError: (e) => toast.error(String(e instanceof Error ? e.message : e)),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_module_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("ההרשאות הוסרו");
    },
    onError: (e) => toast.error(String(e instanceof Error ? e.message : e)),
  });

  const openEdit = (m: TeamMember) => {
    setEditingUser(m);
    setEditPermissions({ ...m.moduleRoles });
  };

  const saveEdit = () => {
    if (!editingUser) return;
    if (Object.keys(editPermissions).length === 0) {
      toast.error("יש לבחור לפחות מודול אחד");
      return;
    }
    updateMutation.mutate({ userId: editingUser.user_id, permissions: editPermissions });
  };

  const handleInvite = () => {
    if (Object.keys(newUserPermissions).length === 0) {
      toast.error("יש לבחור לפחות מודול אחד");
      return;
    }
    inviteMutation.mutate({
      email: newUserEmail.trim(),
      permissions: newUserPermissions,
    });
  };

  if (!canManageSettings) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold hidden md:block">אין גישה</h1>
        <p className="text-muted-foreground mt-2">רק מנהלי מערכת יכולים לגשת להגדרות.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings & Team Management</h1>
        <p className="text-muted-foreground mt-2">ניהול הגדרות מערכת והרשאות צוות</p>
      </div>

      <Card className="rounded-xl border overflow-hidden">
        <CardHeader>
          <CardTitle>חברי צוות והרשאות</CardTitle>
          <CardDescription>
            הזמנת משתמשים חדשים וניהול הרשאות. רק אדמין יכול להוסיף ולהסיר יוזרים. המשתמש יקבל מייל הזמנה עם קישור להגדרת סיסמה.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>הזמן משתמש חדש</Label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full sm:max-w-xs space-y-2">
                <Input
                  type="email"
                  placeholder="כתובת אימייל"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <Button
                onClick={handleInvite}
                disabled={!newUserEmail.trim() || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                הזמן
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">הרשאות מודולים</Label>
              <ModulePermissionsSelector
                value={newUserPermissions}
                onChange={setNewUserPermissions}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MembersTable
              members={members}
              onEdit={openEdit}
              onRemove={(m) => {
                if (confirm("להסיר את כל ההרשאות של המשתמש?")) {
                  removeMutation.mutate(m.user_id);
                }
              }}
              isRemoving={removeMutation.isPending}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת הרשאות</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <>
              <p className="text-sm text-muted-foreground">
                {editingUser.full_name || "—"} ({editingUser.email})
              </p>
              <ModulePermissionsSelector
                value={editPermissions}
                onChange={setEditPermissions}
              />
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              ביטול
            </Button>
            <Button
              onClick={saveEdit}
              disabled={
                updateMutation.isPending || Object.keys(editPermissions).length === 0
              }
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "שמור"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>אינטגרציות</CardTitle>
          <CardDescription>חיבור שירותים חיצוניים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Shopify</h3>
              <p className="text-sm text-muted-foreground">סנכרון מוצרים והזמנות</p>
            </div>
            <Badge>מחובר</Badge>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Green Invoice</h3>
              <p className="text-sm text-muted-foreground">יצירת חשבוניות מס</p>
            </div>
            <Badge variant="outline">בקרוב</Badge>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Resend (Email)</h3>
              <p className="text-sm text-muted-foreground">שליחת הצעות ועדכונים במייל</p>
            </div>
            <Badge>מחובר</Badge>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">שליחת הודעות ללקוחות</p>
            </div>
            <Badge>פעיל (קישורים ידניים)</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
