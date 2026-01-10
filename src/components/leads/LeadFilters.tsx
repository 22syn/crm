import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
}

const statusOptions = [
  { value: "all", label: "כל הסטטוסים" },
  { value: "new", label: "חדש" },
  { value: "contacted", label: "נוצר קשר" },
  { value: "qualified", label: "מתאים" },
  { value: "quoted", label: "נשלחה הצעה" },
  { value: "won", label: "נסגר" },
  { value: "lost", label: "אבוד" },
];

const sourceOptions = [
  { value: "all", label: "כל המקורות" },
  { value: "whatsapp", label: "💬 WhatsApp" },
  { value: "manual", label: "✏️ ידני" },
  { value: "walkin", label: "🚶 נכנס לחנות" },
  { value: "website", label: "🌐 אתר" },
  { value: "referral", label: "👥 הפניה" },
  { value: "instagram", label: "📷 אינסטגרם" },
  { value: "facebook", label: "📘 פייסבוק" },
  { value: "campaign", label: "📣 קמפיין" },
  { value: "architects", label: "🏛️ אדריכלים" },
];

export function LeadFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
}: LeadFiltersProps) {
  const hasFilters = search || statusFilter !== "all" || sourceFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onSourceFilterChange("all");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם, אימייל, טלפון..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-9"
          dir="rtl"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="סטטוס" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="מקור" />
        </SelectTrigger>
        <SelectContent>
          {sourceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
