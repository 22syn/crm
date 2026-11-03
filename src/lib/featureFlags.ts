/**
 * Feature flags live in company_settings.features (jsonb), one object per module.
 * Only boolean `true` turns a feature on; anything else (missing, "true", 1) is off.
 */
export type FeatureFlags = Readonly<Record<string, boolean>>;

export const NO_FEATURES: FeatureFlags = Object.freeze({});

/** Normalizes a raw jsonb value into flags, dropping non-boolean entries. */
export function normalizeFeatures(raw: unknown): FeatureFlags {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return NO_FEATURES;

  const flags: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "boolean") flags[key] = value;
  }
  return flags;
}

export function isFeatureEnabled(features: FeatureFlags | undefined, key: string): boolean {
  return features?.[key] === true;
}

/** Parses admin-entered JSON. Throws when the text is not an object of booleans. */
export function parseFeaturesJson(text: string): FeatureFlags {
  const trimmed = text.trim();
  if (trimmed === "") return NO_FEATURES;

  const parsed: unknown = JSON.parse(trimmed);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error('Feature flags must be a JSON object, e.g. {"quotes": true}');
  }
  const invalidKey = Object.entries(parsed).find(([, value]) => typeof value !== "boolean")?.[0];
  if (invalidKey !== undefined) {
    throw new Error(`Feature flag "${invalidKey}" must be true or false`);
  }
  return parsed as FeatureFlags; // Safe: every value was checked to be boolean above.
}
