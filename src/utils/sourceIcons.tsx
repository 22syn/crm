import type { LucideIcon } from "lucide-react";
import { Camera, Globe, Building2, Leaf, Facebook, Pin } from "lucide-react";

export type LeadSourceKey = "instagram" | "website" | "architects" | "organic" | "facebook";

export const SOURCE_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  instagram: { label: "Instagram", Icon: Camera },
  website: { label: "Website", Icon: Globe },
  architects: { label: "Architects", Icon: Building2 },
  organic: { label: "Organic", Icon: Leaf },
  facebook: { label: "Facebook", Icon: Facebook },
};

export function getSourceConfig(source: string) {
  return SOURCE_ICONS[source] ?? { label: source, Icon: Pin };
}
