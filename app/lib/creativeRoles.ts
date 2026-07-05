export const CREATIVE_ROLE_BASELINE = "baseline" as const;
export const CREATIVE_ROLE_REPLACEMENT = "replacement" as const;

export type CreativeRole = typeof CREATIVE_ROLE_BASELINE | typeof CREATIVE_ROLE_REPLACEMENT;

export function tagCreativeRole<T extends Record<string, unknown>>(creative: T, role: CreativeRole): T & { creativeRole: CreativeRole } {
  return { ...creative, creativeRole: role };
}
