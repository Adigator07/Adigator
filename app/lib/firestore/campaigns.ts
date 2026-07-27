import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/app/lib/firebase/admin";

export type CampaignRecord = {
  id: string;
  ownerId: string;
  name: string;
  platform: string;
  goal: string;
  vertical: string;
  landingUrl: string;
  brief: string;
  createdAt: string;
  updatedAt: string;
};

type CampaignInput = {
  name: string;
  platform?: string;
  goal?: string;
  vertical?: string;
  landingUrl?: string;
  brief?: string;
};

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return new Date().toISOString();
}

function mapCampaign(docId: string, data: Record<string, unknown>): CampaignRecord {
  return {
    id: docId,
    ownerId: String(data.ownerId || ""),
    name: String(data.name || "Untitled campaign"),
    platform: String(data.platform || ""),
    goal: String(data.goal || ""),
    vertical: String(data.vertical || ""),
    landingUrl: String(data.landingUrl || ""),
    brief: String(data.brief || ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function listCampaignsForOwner(ownerId: string): Promise<CampaignRecord[]> {
  const db = getFirebaseAdminFirestore();
  const snapshot = await db
    .collection("campaigns")
    .where("ownerId", "==", ownerId)
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();

  return snapshot.docs.map((doc) => mapCampaign(doc.id, doc.data()));
}

export async function createCampaign(ownerId: string, input: CampaignInput): Promise<CampaignRecord> {
  const db = getFirebaseAdminFirestore();
  const ref = db.collection("campaigns").doc();

  const payload = {
    ownerId,
    name: input.name?.trim() || "Untitled campaign",
    platform: input.platform?.trim() || "",
    goal: input.goal?.trim() || "",
    vertical: input.vertical?.trim() || "",
    landingUrl: input.landingUrl?.trim() || "",
    brief: input.brief?.trim() || "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(payload);
  const doc = await ref.get();
  return mapCampaign(doc.id, doc.data() || {});
}

export async function getCampaign(ownerId: string, campaignId: string): Promise<CampaignRecord | null> {
  const db = getFirebaseAdminFirestore();
  const doc = await db.collection("campaigns").doc(campaignId).get();
  if (!doc.exists) return null;

  const data = doc.data() || {};
  if (String(data.ownerId || "") !== ownerId) return null;
  return mapCampaign(doc.id, data);
}

export async function updateCampaign(ownerId: string, campaignId: string, input: Partial<CampaignInput>): Promise<CampaignRecord | null> {
  const db = getFirebaseAdminFirestore();
  const ref = db.collection("campaigns").doc(campaignId);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const existingData = existing.data() || {};
  if (String(existingData.ownerId || "") !== ownerId) return null;

  const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof input.name === "string") patch.name = input.name.trim();
  if (typeof input.platform === "string") patch.platform = input.platform.trim();
  if (typeof input.goal === "string") patch.goal = input.goal.trim();
  if (typeof input.vertical === "string") patch.vertical = input.vertical.trim();
  if (typeof input.landingUrl === "string") patch.landingUrl = input.landingUrl.trim();
  if (typeof input.brief === "string") patch.brief = input.brief.trim();

  await ref.update(patch);
  const updated = await ref.get();
  return mapCampaign(updated.id, updated.data() || {});
}

export async function deleteCampaign(ownerId: string, campaignId: string): Promise<boolean> {
  const db = getFirebaseAdminFirestore();
  const ref = db.collection("campaigns").doc(campaignId);
  const existing = await ref.get();
  if (!existing.exists) return false;

  const existingData = existing.data() || {};
  if (String(existingData.ownerId || "") !== ownerId) return false;

  await ref.delete();
  return true;
}
