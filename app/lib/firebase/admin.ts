import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

type ServiceAccountInput = {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function normalizeServiceAccount(input: ServiceAccountInput): ServiceAccountInput {
  return {
    projectId: input.projectId || input.project_id,
    clientEmail: input.clientEmail || input.client_email,
    privateKey: input.privateKey || input.private_key,
  };
}

function resolveServiceAccount(): ServiceAccountInput {
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (filePath) {
    try {
      const raw = readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw) as ServiceAccountInput;
      return normalizeServiceAccount(parsed);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_FILE is not readable JSON.");
    }
  }

  const fromJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (fromJson) {
    try {
      const parsed = JSON.parse(fromJson) as ServiceAccountInput;
      return normalizeServiceAccount(parsed);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

function ensureAdminApp() {
  if (getApps().length) return getApp();

  const serviceAccount = resolveServiceAccount();
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error("Firebase admin credentials are not configured.");
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
    }),
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(ensureAdminApp());
}

export function getFirebaseAdminFirestore() {
  return getFirestore(ensureAdminApp());
}
