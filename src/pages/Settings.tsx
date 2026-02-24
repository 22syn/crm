import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2 } from "lucide-react";

export default function Settings() {
  const { superAdmin, isModuleAdmin } = useAuth();
  const canManageSettings = superAdmin || isModuleAdmin("system");
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "sales">("sales");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["team-users"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          role,
          user_id,
          created_at
        `);

      if (error) throw error;

      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      return roles.map(r => ({
        ...r,
        profile: profiles?.find(p => p.user_id === r.user_id),
      }));
    },
    enabled: canManageSettings,
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "sales" }) => {
      const modules: Array<{ module: string; role: string }> =
        role === "admin"
          ? [
              { module: "leads", role: "admin" },
              { module: "ad_agency", role: "admin" },
              { module: "system", role: "admin" },
            ]
          : [
              { module: "leads", role: "user" },
              { module: "ad_agency", role: "user" },
            ];
      for (const m of modules) {
        const { error } = await supabase.from("user_module_roles").upsert(
          { user_id: userId, module: m.module, role: m.role },
          { onConflict: "user_id,module" }
        );
        if (error) throw error;
      }
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      toast.success("Permission assigned successfully");
      setNewUserEmail("");
    },
    onError: (error) => {
      toast.error("Error assigning permission: " + error.message);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { data: row } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("id", roleId)
        .single();
      if (row?.user_id) {
        const { error } = await supabase
          .from("user_module_roles")
          .delete()
          .eq("user_id", row.user_id);
        if (error) throw error;
      }
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      toast.success("Permission removed successfully");
    },
    onError: (error) => {
      toast.error("Error removing permission: " + error.message);
    },
  });

  if (!canManageSettings) {
    return (
      <div className="text-center py-12">
          <h1 className="text-2xl font-bold hidden md:block">Access denied</h1>
          <p className="text-muted-foreground mt-2">
            Only admins can access settings.
          </p>
        </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage system and team settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
            <CardDescription>
              Manage system access and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="user-email">User email</Label>
                <Input
                  id="user-email"
                  placeholder="Enter email of a user registered in the system"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Role</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "admin" | "sales")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={async () => {
                  const { data: profiles } = await supabase
                    .from("profiles")
                    .select("user_id")
                    .eq("email", newUserEmail)
                    .limit(1);

                  if (!profiles?.length) {
                    toast.error("User not found. The user must sign up first.");
                    return;
                  }

                  addRoleMutation.mutate({
                    userId: profiles[0].user_id,
                    role: newUserRole,
                  });
                }}
                disabled={!newUserEmail || addRoleMutation.isPending}
              >
                {addRoleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <UserPlus className="h-4 w-4 ml-2" />
                )}
                Add
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No team members yet
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.profile?.full_name || "—"}</TableCell>
                      <TableCell>{user.profile?.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Admin" : "Sales"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRoleMutation.mutate(user.id)}
                          disabled={removeRoleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Connect external services to the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Shopify</h3>
                <p className="text-sm text-muted-foreground">
                  Sync products and orders from Shopify store
                </p>
              </div>
              <Badge>Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Green Invoice</h3>
                <p className="text-sm text-muted-foreground">
                  Generate Israeli tax invoices
                </p>
              </div>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Resend (Email)</h3>
                <p className="text-sm text-muted-foreground">
                  Send quotes and updates by email
                </p>
              </div>
              <Badge>Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Send messages to customers via WhatsApp
                </p>
              </div>
              <Badge>Active (manual links)</Badge>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
