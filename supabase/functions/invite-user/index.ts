import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origins = Deno.env.get("ALLOWED_ORIGINS")?.split(",").map((s) => s.trim()) ?? ["*"];
  const reqOrigin = req.headers.get("Origin");
  const allowOrigin =
    origins.includes("*") || (reqOrigin && origins.includes(reqOrigin)) ? (reqOrigin ?? origins[0]) : origins[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

interface InviteRequest {
  email: string;
  permissions: Record<string, "admin" | "user">;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("super_admin")
      .eq("user_id", user.id)
      .single();

    const { data: moduleRoles } = await adminClient
      .from("user_module_roles")
      .select("module, role")
      .eq("user_id", user.id);

    const isSuperAdmin = profile?.super_admin === true;
    const isSystemAdmin = (moduleRoles ?? []).some((r) => r.module === "system");
    const hasLegacyAdmin = await (async () => {
      const { data } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);
      return (data?.length ?? 0) > 0;
    })();

    if (!isSuperAdmin && !isSystemAdmin && !hasLegacyAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can invite users" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = (await req.json()) as InviteRequest;
    const email = (body?.email ?? "").trim().toLowerCase();
    const permissions = body?.permissions ?? {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const validModules = ["leads", "ad_agency", "system"];
    const validRoles = ["admin", "user"];
    const toInsert = Object.entries(permissions)
      .filter(([mod, role]) => validModules.includes(mod) && validRoles.includes(role))
      .map(([module, role]) => ({ module, role }));

    if (toInsert.length === 0) {
      return new Response(
        JSON.stringify({ error: "Select at least one module" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${new URL(req.url).origin}/` }
    );

    if (inviteError) {
      if (inviteError.message?.includes("already been registered") || inviteError.message?.includes("already exists")) {
        const { data: existing } = await adminClient
          .from("profiles")
          .select("user_id")
          .eq("email", email)
          .limit(1)
          .single();

        if (existing?.user_id) {
          await adminClient.from("user_module_roles").delete().eq("user_id", existing.user_id);
          for (const { module, role } of toInsert) {
            await adminClient.from("user_module_roles").upsert(
              { user_id: existing.user_id, module, role },
              { onConflict: "user_id,module" }
            );
          }
          return new Response(
            JSON.stringify({ success: true, message: "Permissions updated for existing user" }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const newUserId = inviteData.user?.id;
    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    for (const { module, role } of toInsert) {
      await adminClient.from("user_module_roles").insert({
        user_id: newUserId,
        module,
        role,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e instanceof Error ? e.message : e) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
