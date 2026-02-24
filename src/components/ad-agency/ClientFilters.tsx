import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface ClientFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** "all" | "active" | "inactive" */
  activeFilter?: string;
  onActiveFilterChange?: (value: string) => void;
  /** default: full; searchOnly: רק חיפוש; filtersOnly: רק סטטוס (למובייל) */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

export function ClientFilters({
  search,
  onSearchChange,
  activeFilter = "all",
  onActiveFilterChange,
  variant = "default",
}: ClientFiltersProps) {
  const showSearch = variant === "default" || variant === "searchOnly";
  const showFilters = variant === "default" || variant === "filtersOnly";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0" dir="rtl">
      {showSearch && (
        <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="חיפוש לקוחות..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-9 h-9 rounded-md text-sm"
          />
        </div>
      )}
      {showFilters && onActiveFilterChange && (
        <Select value={activeFilter} onValueChange={onActiveFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-md font-normal shrink-0">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הלקוחות</SelectItem>
            <SelectItem value="active">פעילים בלבד</SelectItem>
            <SelectItem value="inactive">לא פעילים</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
