import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseClientEnv = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function readEnv(value: string | undefined): string {
  return String(value || "").trim();
}

/** Always read env at call-time so Next can inline NEXT_PUBLIC_* values correctly. */
export function getFirebaseClientEnv(): FirebaseClientEnv {
  return {
    apiKey: readEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: readEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: readEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: readEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: readEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: readEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };
}

export function getMissingFirebaseClientEnvVars(): string[] {
  const env = getFirebaseClientEnv();
  const missing: string[] = [];
  if (!env.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!env.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!env.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!env.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
  return missing;
}

export function hasFirebaseClientConfig(): boolean {
  return getMissingFirebaseClientEnvVars().length === 0;
}

export function getFirebaseClientApp(): FirebaseApp {
  if (!hasFirebaseClientConfig()) {
    const missing = getMissingFirebaseClientEnvVars();
    throw new Error(
      `Firebase client environment is not configured. Missing: ${missing.join(", ")}`,
    );
  }

  if (getApps().length) return getApp();
  return initializeApp(getFirebaseClientEnv());
}

export function getFirebaseClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

export function getFirebaseClientAuthOrNull(): Auth | null {
  if (!hasFirebaseClientConfig()) return null;
  try {
    return getFirebaseClientAuth();
  } catch {
    return null;
  }
}

export function getFirebaseClientFirestore(): Firestore {
  return getFirestore(getFirebaseClientApp());
}

export function getFirebaseClientFirestoreOrNull(): Firestore | null {
  if (!hasFirebaseClientConfig()) return null;
  try {
    return getFirebaseClientFirestore();
  } catch {
    return null;
  }
}
