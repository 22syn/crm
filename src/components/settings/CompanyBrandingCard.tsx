import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CompanyModule } from "@/lib/branding";
import { CompanyBrandingForm } from "./CompanyBrandingForm";

const MODULE_LABELS: Readonly<Record<CompanyModule, string>> = {
  leads: "CRM (leads)",
  ad_agency: "משרד פרסום (ad_agency)",
};

interface CompanyBrandingCardProps {
  /** Modules the current user administers. */
  readonly modules: readonly CompanyModule[];
  readonly canEditFeatures: boolean;
}

export function CompanyBrandingCard({ modules, canEditFeatures }: CompanyBrandingCardProps) {
  if (modules.length === 0) return null;

  return (
    <Card className="rounded-xl border overflow-hidden">
      <CardHeader>
        <CardTitle>מיתוג החברה</CardTitle>
        <CardDescription>
          שם, לוגו וצבע שיופיעו במסך ההתחברות ובתפריט. Company name, logo and color shown on the login page and sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {modules.length === 1 ? (
          <CompanyBrandingForm module={modules[0]} canEditFeatures={canEditFeatures} />
        ) : (
          <Tabs defaultValue={modules[0]}>
            <TabsList>
              {modules.map((module) => (
                <TabsTrigger key={module} value={module}>
                  {MODULE_LABELS[module]}
                </TabsTrigger>
              ))}
            </TabsList>
            {modules.map((module) => (
              <TabsContent key={module} value={module} className="pt-4">
                <CompanyBrandingForm module={module} canEditFeatures={canEditFeatures} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
