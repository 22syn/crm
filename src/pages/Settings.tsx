import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
  const { role } = useAuth();
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
    enabled: role === "admin",
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "sales" }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      toast.success("הרשאה הוקצתה בהצלחה");
      setNewUserEmail("");
    },
    onError: (error) => {
      toast.error("שגיאה בהקצאת הרשאה: " + error.message);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      toast.success("הרשאה הוסרה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בהסרת הרשאה: " + error.message);
    },
  });

  if (role !== "admin") {
    return (
      <DashboardLayout>
        <div className="text-center py-12" dir="rtl">
          <h1 className="text-2xl font-bold">אין גישה</h1>
          <p className="text-muted-foreground mt-2">
            רק מנהלים יכולים לגשת להגדרות.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold">הגדרות</h1>
          <p className="text-muted-foreground">ניהול הגדרות המערכת והצוות</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>חברי צוות</CardTitle>
            <CardDescription>
              ניהול גישה למערכת והרשאות.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="user-email">אימייל משתמש</Label>
                <Input
                  id="user-email"
                  placeholder="הכנס אימייל של משתמש שנרשם למערכת"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>תפקיד</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "admin" | "sales")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">מנהל</SelectItem>
                    <SelectItem value="sales">מכירות</SelectItem>
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
                    toast.error("משתמש לא נמצא. המשתמש צריך להירשם קודם.");
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
                הוסף
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">תפקיד</TableHead>
                  <TableHead className="text-right">נוסף</TableHead>
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
                      אין חברי צוות עדיין
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.profile?.full_name || "—"}</TableCell>
                      <TableCell>{user.profile?.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "מנהל" : "מכירות"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("he-IL")}
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
            <CardTitle>אינטגרציות</CardTitle>
            <CardDescription>
              חיבור שירותים חיצוניים למערכת.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Shopify</h3>
                <p className="text-sm text-muted-foreground">
                  סנכרון מוצרים והזמנות מחנות Shopify
                </p>
              </div>
              <Badge>מחובר</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Green Invoice</h3>
                <p className="text-sm text-muted-foreground">
                  הפקת חשבוניות מס ישראליות
                </p>
              </div>
              <Badge variant="outline">בקרוב</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
