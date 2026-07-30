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

function hasClientConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey
      && firebaseConfig.authDomain
      && firebaseConfig.projectId
      && firebaseConfig.appId,
  );
}

export function getFirebaseClientApp() {
  if (!hasClientConfig()) {
    throw new Error("Firebase client environment is not configured.");
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}

export function getFirebaseClientFirestore() {
  return getFirestore(getFirebaseClientApp());
}
