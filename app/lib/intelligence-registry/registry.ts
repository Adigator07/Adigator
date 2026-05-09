import { DATASET_SOURCES } from "./taxonomy";
import { makeProfileKey, normalizeProfileLookup } from "./normalization";
import { GOAL_BASELINES, PROFILE_OVERRIDES, VERTICAL_BASELINES } from "./profile-data";
import type {
  CampaignGoal,
  DatasetSource,
  IntelligenceProfile,
  IntelligenceProfilePatch,
  ProfileLookupInput,
  ScoringPreferences,
  VerticalKey,
} from "./types";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function mergeValue<T>(base: T, patch: unknown): T {
  if (Array.isArray(base) && Array.isArray(patch)) {
    if (base.every((item) => typeof item === "string") && patch.every((item) => typeof item === "string")) {
      return uniqueStrings([...(base as string[]), ...(patch as string[])]) as T;
    }
    return [...base, ...patch] as T;
  }

  if (isPlainObject(base) && isPlainObject(patch)) {
    return mergeObjects(base, patch) as T;
  }

  return (patch ?? base) as T;
}

function mergeObjects<T extends PlainObject>(base: T, patch: PlainObject): T {
  const output: PlainObject = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    output[key] = key in output ? mergeValue(output[key], value) : value;
  });
  return output as T;
}

function normalizeWeights(preferences: ScoringPreferences): ScoringPreferences {
  const entries = Object.entries(preferences.weights) as Array<[keyof ScoringPreferences["weights"], number]>;
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  if (total <= 0) return preferences;

  const normalized = entries.reduce<ScoringPreferences["weights"]>((acc, [key, value]) => {
    acc[key] = Number((value / total).toFixed(4));
    return acc;
  }, { ...preferences.weights });

  return {
    ...preferences,
    weights: normalized,
  };
}

function datasetSourceFor(goal: CampaignGoal): DatasetSource[] {
  return [DATASET_SOURCES[goal]];
}

function createBaseProfile(goal: CampaignGoal, vertical: VerticalKey): IntelligenceProfile {
  const key = makeProfileKey(goal, vertical);

  const profile = mergeObjects(
    {
      key,
      goal,
      vertical,
      label: `${goal} / ${vertical}`,
      source: datasetSourceFor(goal),
      ...(GOAL_BASELINES[goal] as PlainObject),
    },
    VERTICAL_BASELINES[vertical] as PlainObject
  ) as unknown as IntelligenceProfile;

  const override = PROFILE_OVERRIDES[key] as IntelligenceProfilePatch | undefined;
  const merged = override
    ? (mergeObjects(profile as unknown as PlainObject, override as PlainObject) as unknown as IntelligenceProfile)
    : profile;

  return {
    ...merged,
    key,
    goal,
    vertical,
    label: merged.label ?? `${goal} / ${vertical}`,
    source: merged.source?.length ? merged.source : datasetSourceFor(goal),
    scoringPreferences: normalizeWeights(merged.scoringPreferences),
  };
}

const profileCache = new Map<string, IntelligenceProfile>();

export function loadIntelligenceProfile(goal: CampaignGoal, vertical: VerticalKey): IntelligenceProfile {
  const key = makeProfileKey(goal, vertical);
  const cached = profileCache.get(key);
  if (cached) return cached;

  const profile = createBaseProfile(goal, vertical);
  profileCache.set(key, profile);
  return profile;
}

export function getIntelligenceProfile(input: ProfileLookupInput): IntelligenceProfile {
  const { goal, vertical } = normalizeProfileLookup(input);
  return loadIntelligenceProfile(goal, vertical);
}

export function hasIntelligenceProfile(input: ProfileLookupInput): boolean {
  try {
    getIntelligenceProfile(input);
    return true;
  } catch {
    return false;
  }
}

export function listProfileKeys(): string[] {
  const goals: CampaignGoal[] = ["awareness", "consideration", "conversion"];
  const verticals: VerticalKey[] = [
    "automotive",
    "banking",
    "ecommerce",
    "education",
    "entertainment",
    "finance",
    "food",
    "gaming",
    "healthcare",
    "hotels",
    "luxury",
    "news_media",
    "real_estate",
    "sports",
    "technology",
    "travel",
  ];

  return goals.flatMap((goal) => verticals.map((vertical) => makeProfileKey(goal, vertical)));
}

export function getCtaExamples(input: ProfileLookupInput): string[] {
  return getIntelligenceProfile(input).ctaExpectations.examples;
}

export function getScoringWeights(input: ProfileLookupInput): ScoringPreferences["weights"] {
  return getIntelligenceProfile(input).scoringPreferences.weights;
}

export function getDesignRules(input: ProfileLookupInput): IntelligenceProfile["designPsychologyRules"] {
  return getIntelligenceProfile(input).designPsychologyRules;
}

export function clearProfileCache(): void {
  profileCache.clear();
}
