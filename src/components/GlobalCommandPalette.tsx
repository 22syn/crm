import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LayoutDashboard, Users, Handshake, FileText, Plus, LayoutGrid, Package, ListTodo } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { escapeIlike } from "@/lib/escapeIlike";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

const RECENT_SEARCHES_KEY = "demo-recent-lead-ids";
const MAX_RECENT = 5;

function getRecentLeadIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function pushRecentLeadId(leadId: string) {
  const recent = getRecentLeadIds();
  const next = [leadId, ...recent.filter((id) => id !== leadId)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["global-search-leads", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const escaped = escapeIlike(search.trim());
      const { data, error } = await supabase
        .from("leads")
        .select("id, customer_name, customer_email, customer_phone, status")
        .or(
          `customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%,customer_phone.ilike.%${escaped}%`
        )
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
    enabled: open && search.length >= 2,
  });

  const { data: recentLeads = [] } = useQuery({
    queryKey: ["global-search-recent", open],
    queryFn: async () => {
      const ids = getRecentLeadIds();
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("id, customer_name, customer_email, status")
        .in("id", ids);
      if (error) throw error;
      const list = (data ?? []) as Lead[];
      return ids.map((id) => list.find((l) => l.id === id)).filter(Boolean) as Lead[];
    },
    enabled: open && !search.trim(),
  });

  const runCommand = useCallback(
    (callback: () => void) => {
      setOpen(false);
      setSearch("");
      callback();
    },
    []
  );

  const handleSelectLead = (lead: Lead) => {
    runCommand(() => {
      pushRecentLeadId(lead.id);
      navigate("/leads", { state: { openLeadId: lead.id } });
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search leads by name, email, phone..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {search.trim().length >= 2 ? (searchLoading ? "Searching..." : "No results.") : "Type to search leads."}
        </CommandEmpty>
        {!search.trim() && (
          <>
          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/leads", { state: { openNewLead: true } }))}>
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/leads"))}>
              <Users className="mr-2 h-4 w-4" />
              Leads
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/deals"))}>
              <Handshake className="mr-2 h-4 w-4" />
              Deals
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/contracts"))}>
              <FileText className="mr-2 h-4 w-4" />
              Contracts
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="משרד פרסום">
            <CommandItem onSelect={() => runCommand(() => navigate("/ad-agency"))}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              דשבורד משרד פרסום
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/ad-agency/projects"))}>
              <FileText className="mr-2 h-4 w-4" />
              פרויקטים
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/contracts"))}>
              <FileText className="mr-2 h-4 w-4" />
              הצעות מחיר
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/ad-agency/clients"))}>
              <Users className="mr-2 h-4 w-4" />
              לקוחות
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/ad-agency/tasks"))}>
              <ListTodo className="mr-2 h-4 w-4" />
              משימות
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/ad-agency/items"))}>
              <Package className="mr-2 h-4 w-4" />
              פריטים
            </CommandItem>
          </CommandGroup>
          </>
        )}
        {!search.trim() && recentLeads.length > 0 && (
          <CommandGroup heading="Recent">
            {recentLeads.map((lead) => (
              <CommandItem key={lead.id} onSelect={() => handleSelectLead(lead)}>
                <span className="truncate">{lead.customer_name}</span>
                <span className="ml-2 text-meta text-muted-foreground truncate">
                  — {lead.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {search.trim().length >= 2 && (
          <CommandGroup heading="Leads">
            {searchResults.map((lead) => (
              <CommandItem key={lead.id} onSelect={() => handleSelectLead(lead)}>
                <span className="truncate">{lead.customer_name}</span>
                <span className="ml-2 text-meta text-muted-foreground truncate">
                  — {lead.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
