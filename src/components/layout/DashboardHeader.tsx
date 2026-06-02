import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "./ThemeSelector";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });
  const displayName =
    profile?.full_name?.trim() || user?.email?.split("@")[0] || "User";

  const handleSearchClick = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <header className="hidden md:flex h-16 bg-background border-b border-border items-center justify-between px-6 z-[1] shrink-0">
      <div className="flex-1 max-w-xl">
        <button
          type="button"
          onClick={handleSearchClick}
          className="relative block w-full text-left"
        >
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg text-sm text-muted-foreground bg-background hover:bg-accent/50 transition-colors">
            Search leads, contacts, deals...
          </span>
        </button>
      </div>
      <div className="ml-4 flex items-center gap-4">
        <ThemeSelector />
        <button
          type="button"
          className="relative p-1 rounded-full text-muted-foreground hover:text-foreground focus:outline-none"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 cursor-pointer rounded-md hover:bg-accent px-2 py-1.5 -mx-2 -my-1.5 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent-action text-accent-action-foreground text-sm">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:inline">
                {displayName}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[100] w-56">
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
