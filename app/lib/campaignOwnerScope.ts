import { getClientSession } from "@/app/lib/supabaseAuthClient";

export const GUEST_OWNER_ID_KEY = "adigator_guest_owner_id";

function ensureGuestOwnerId(): string {
  if (typeof window === "undefined") return "guest-server";
  let guestId = localStorage.getItem(GUEST_OWNER_ID_KEY);
  if (!guestId) {
    guestId = `guest-${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_OWNER_ID_KEY, guestId);
  }
  return guestId;
}

/** Returns Supabase user id when logged in, otherwise a stable per-browser guest owner id. */
export async function resolveCampaignOwnerId(): Promise<string> {
  try {
    const session = await getClientSession();
    if (session?.user?.id) return session.user.id;
  } catch {
    // Fall through to guest scope.
  }
  return ensureGuestOwnerId();
}

export function isAuthenticatedOwnerId(ownerId: string): boolean {
  return Boolean(ownerId) && !ownerId.startsWith("guest-");
}
