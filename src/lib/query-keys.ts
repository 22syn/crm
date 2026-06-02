/**
 * Central query key factories for TanStack Query.
 * Migrate pages gradually to use these instead of inline strings.
 */
export const queryKeys = {
  leads: {
    all: ["leads"] as const,
    list: (filters?: Record<string, unknown>) => ["leads", "list", filters ?? {}] as const,
    listFilters: (
      page: number,
      search: string,
      statusFilter: string[],
      sourceFilter: string,
      assigneeFilter: string,
      noMeetingFilter: boolean
    ) => ["leads", page, search, statusFilter, sourceFilter, assigneeFilter, noMeetingFilter] as const,
    detail: (id: string) => ["leads", id] as const,
  },
  deals: {
    all: ["deals"] as const,
    list: (filters?: Record<string, unknown>) => ["deals", "list", filters ?? {}] as const,
    detail: (id: string) => ["deals", id] as const,
  },
  quotes: {
    all: ["quotes"] as const,
    byLead: (leadId: string) => ["quotes", "lead", leadId] as const,
    leadQuotes: (leadIds: string[]) => ["lead-quotes", leadIds.join(",")] as const,
    leadQuotesAll: ["lead-quotes"] as const,
  },
  opProjects: {
    all: ["op_project"] as const,
    detail: (id: string) => ["op_project", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: (filters?: Record<string, unknown>) => ["customers", "list", filters ?? {}] as const,
  },
};
