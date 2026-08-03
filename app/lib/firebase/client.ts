import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const REQUIRED_CLIENT_ENV_VARS = [
  {
    key: "NEXT_PUBLIC_FIREBASE_API_KEY",
    value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  },
  {
    key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  },
  {
    key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
  {
    key: "NEXT_PUBLIC_FIREBASE_APP_ID",
    value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
] as const;

export function getMissingFirebaseClientEnvVars(): string[] {
  return REQUIRED_CLIENT_ENV_VARS
    .filter((entry) => !entry.value)
    .map((entry) => entry.key);
}

export function hasFirebaseClientConfig(): boolean {
  return getMissingFirebaseClientEnvVars().length === 0;
}

export function getFirebaseClientApp() {
  if (!hasFirebaseClientConfig()) {
    const missing = getMissingFirebaseClientEnvVars();
    throw new Error(
      `Firebase client environment is not configured. Missing: ${missing.join(", ")}`,
    );
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}

export function getFirebaseClientFirestore() {
  return getFirestore(getFirebaseClientApp());
}

export function getFirebaseClientFirestoreOrNull() {
  try {
    return getFirebaseClientFirestore();
  } catch {
    return null;
  }
}
