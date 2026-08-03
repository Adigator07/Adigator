const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value && value.trim()) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  return "";
};

export const env = {
  nodeEnv: getEnvVar("NODE_ENV", "development"),
  appUrl: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  isDevelopment: getEnvVar("NODE_ENV", "development") !== "production",
  isProduction: getEnvVar("NODE_ENV", "development") === "production",
  firebase: {
    apiKey: getEnvVar("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: getEnvVar("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnvVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: getEnvVar("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnvVar("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnvVar("NEXT_PUBLIC_FIREBASE_APP_ID"),
  },
  supabase: {
    url: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  },
  logging: {
    level: getEnvVar("NEXT_PUBLIC_LOG_LEVEL", "info"),
    enabled: getEnvVar("NEXT_PUBLIC_ENABLE_LOGGING", "true") === "true",
  },
  features: {
    enableAnalytics: getEnvVar("NEXT_PUBLIC_ENABLE_ANALYTICS", "false") === "true",
  },
} as const;

export function getMissingEnvVars(keys: string[]): string[] {
  return keys.filter((key) => !getEnvVar(key));
}
