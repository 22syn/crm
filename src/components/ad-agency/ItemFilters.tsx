import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ItemFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** default: full; searchOnly: רק חיפוש (למובייל - חפש בחוץ); filtersOnly: רק חיפוש (למובייל - בתוך Sheet) */
  variant?: "default" | "searchOnly" | "filtersOnly";
}

export function ItemFilters({
  search,
  onSearchChange,
  variant = "default",
}: ItemFiltersProps) {
  const showSearch = variant === "default" || variant === "searchOnly" || variant === "filtersOnly";

  if (!showSearch) return null;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0" dir="rtl">
      <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="חיפוש לפי סוג..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-9 h-9 rounded-md text-sm"
        />
      </div>
    </div>
  );
}
