import { useState, useEffect, useRef, useCallback } from "react";
import { useTablePreferences, type TableFilters } from "./useTablePreferences";

interface UseEntityFiltersOptions<T> {
  pageKey: string;
  initialFilters: T;
  onFiltersChange?: (filters: T) => void;
  normalizeFilters?: (filters: TableFilters) => T;
  debounceMs?: number;
}

export function useEntityFilters<T extends TableFilters>({
  pageKey,
  initialFilters,
  onFiltersChange,
  normalizeFilters,
  debounceMs = 300,
}: UseEntityFiltersOptions<T>) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [searchInput, setSearchInput] = useState((initialFilters.search as string) || "");

  const appliedSavedRef = useRef(false);
  const preferences = useTablePreferences(pageKey);
  const { filters: savedFilters } = preferences;

  // Track if we're currently applying saved filters to avoid triggering onFiltersChange unnecessarily
  const isSyncingRef = useRef(false);

  // Handle search debouncing
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters((prev) => ({ ...prev, search: searchInput }));
      }
    }, debounceMs);
    return () => clearTimeout(t);
  }, [searchInput, debounceMs, filters.search]);

  // Notify consumer when filters change
  useEffect(() => {
    if (!isSyncingRef.current) {
      onFiltersChange?.(filters);
    }
  }, [filters, onFiltersChange]);

  // Sync with saved preferences on load
  useEffect(() => {
    if (appliedSavedRef.current || !savedFilters) return;

    isSyncingRef.current = true;
    const baseFilters = {
      ...initialFilters,
      ...savedFilters,
    };

    const newFilters = normalizeFilters
      ? normalizeFilters(baseFilters as TableFilters)
      : (baseFilters as T);

    setFilters(newFilters);

    if (typeof savedFilters.search === "string") {
      setSearchInput(savedFilters.search);
    }

    appliedSavedRef.current = true;
    // Small timeout to let state updates settle before enabling onFiltersChange
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [savedFilters, initialFilters, normalizeFilters]);

  const setFilter = useCallback((key: keyof T, value: T[keyof T]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyView = useCallback((newFilters: Record<string, string | string[]>) => {
    isSyncingRef.current = true;
    const merged = { ...initialFilters, ...newFilters } as T;
    setFilters(merged);
    if (typeof newFilters.search === "string") {
      setSearchInput(newFilters.search);
    }
    setTimeout(() => {
      isSyncingRef.current = false;
      onFiltersChange?.(merged);
    }, 0);
  }, [initialFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchInput((initialFilters.search as string) || "");
  }, [initialFilters]);

  const handleReset = useCallback(async () => {
    await preferences.resetToDefault();
    clearFilters();
  }, [preferences, clearFilters]);

  return {
    filters,
    setFilter,
    searchInput,
    setSearchInput,
    ...preferences,
    applyView,
    clearFilters,
    resetToDefault: handleReset,
  };
}
