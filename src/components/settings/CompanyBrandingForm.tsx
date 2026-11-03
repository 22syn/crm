import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type CompanyModule,
  type CompanySettings,
  useCompanySettings,
  useUpdateCompanySettings,
} from "@/hooks/useCompanySettings";
import {
  type CompanyBrandingValues,
  companyBrandingSchema,
  getBrandingFormValues,
  getBrandingUpdate,
} from "./companyBrandingSchema";

const BRANDING_MIGRATION = "20261103120000_company_settings_branding.sql";

interface CompanyBrandingFormProps {
  readonly module: CompanyModule;
  readonly canEditFeatures: boolean;
}

/** Loads the module's settings, then mounts the form so default values come from the row. */
export function CompanyBrandingForm({ module, canEditFeatures }: CompanyBrandingFormProps) {
  const { data, isLoading } = useCompanySettings(module);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <BrandingFields key={data?.updated_at ?? module} module={module} settings={data} canEditFeatures={canEditFeatures} />
  );
}

interface BrandingFieldsProps extends CompanyBrandingFormProps {
  readonly settings: CompanySettings | null | undefined;
}

function BrandingFields({ module, settings, canEditFeatures }: BrandingFieldsProps) {
  const updateMutation = useUpdateCompanySettings();
  const isMigrationMissing = settings !== null && settings !== undefined && !("logo_url" in settings);
  const { register, handleSubmit, formState } = useForm<CompanyBrandingValues>({
    resolver: zodResolver(companyBrandingSchema),
    defaultValues: getBrandingFormValues(settings),
  });
  const { errors } = formState;

  const onSubmit = (values: CompanyBrandingValues) =>
    updateMutation.mutate({ module, values: getBrandingUpdate(values, { canEditFeatures }) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isMigrationMissing && (
        <Alert>
          <AlertDescription>
            The branding columns are not in the database yet. Apply migration {BRANDING_MIGRATION} before saving.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${module}-name`} label="Company name" error={errors.name?.message}>
          <Input id={`${module}-name`} placeholder="Xsheva CRM" {...register("name")} />
        </Field>
        <Field id={`${module}-logo`} label="Logo URL" error={errors.logoUrl?.message}>
          <Input id={`${module}-logo`} placeholder="https://… or /logo.png" dir="ltr" {...register("logoUrl")} />
        </Field>
        <Field id={`${module}-color`} label="Primary color" error={errors.primaryColor?.message}>
          <Input id={`${module}-color`} placeholder="#1337EC" dir="ltr" {...register("primaryColor")} />
        </Field>
        <Field id={`${module}-sender`} label="Sender email" error={errors.senderEmail?.message}>
          <Input id={`${module}-sender`} type="email" placeholder="quotes@client.com" dir="ltr" {...register("senderEmail")} />
        </Field>
      </div>
      {canEditFeatures && (
        <Field id={`${module}-features`} label="Feature flags (JSON, super admin only)" error={errors.featuresJson?.message}>
          <Textarea id={`${module}-features`} rows={4} dir="ltr" className="font-mono text-sm" placeholder='{"quotes": true}' {...register("featuresJson")} />
        </Field>
      )}
      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save
      </Button>
    </form>
  );
}

interface FieldProps {
  readonly id: string;
  readonly label: string;
  readonly error?: string;
  readonly children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
