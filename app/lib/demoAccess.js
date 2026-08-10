/**

 * Guest demo access — one Preview Tool session per non-logged-in user.

 * Logged-in users have unlimited access.

 */



import { getFirebaseClientAuth, hasFirebaseClientConfig } from "./firebase/client";
import { onAuthStateChanged } from "firebase/auth";



export const GUEST_DEMO_USED_KEY = "adigator_guest_demo_used";
export const GUEST_DEMO_ACTIVE_KEY = "adigator_guest_demo_active";
export const GUEST_DEMO_REFRESH_KEY = "adigator_preview_refresh";

function isLocalDevHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

async function resolveAuthUser(timeoutMs = 600) {
  if (typeof window === "undefined") return null;
  if (!hasFirebaseClientConfig()) return null;

  const auth = getFirebaseClientAuth();
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (user) => {
      if (settled) return;
      settled = true;
      if (unsubscribe) unsubscribe();
      window.clearTimeout(timer);
      resolve(user || null);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => finish(user));
    const timer = window.setTimeout(() => finish(auth.currentUser || null), timeoutMs);
  });
}

export function clearGuestDemoRestriction() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_DEMO_USED_KEY);
  sessionStorage.removeItem(GUEST_DEMO_ACTIVE_KEY);
  sessionStorage.removeItem(GUEST_DEMO_REFRESH_KEY);
}



export async function isAuthenticatedUser() {
  if (typeof window === "undefined") return false;

  try {
    if (!hasFirebaseClientConfig()) {
      return false;
    }

    const user = await resolveAuthUser();
    if (!user) return false;

    // Preview Tool access gate should not block any authenticated user.
    // Profile status checks are handled by login/auth flows.
    return true;
  } catch {
    return false;
  }
}



export function hasGuestDemoBeenUsed() {

  if (typeof window === "undefined") return false;

  return localStorage.getItem(GUEST_DEMO_USED_KEY) === "true";

}



export function isGuestDemoSessionActive() {

  if (typeof window === "undefined") return false;

  return sessionStorage.getItem(GUEST_DEMO_ACTIVE_KEY) === "true";

}



export function enterGuestDemoSession() {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_DEMO_USED_KEY, "true");
  sessionStorage.setItem(GUEST_DEMO_ACTIVE_KEY, "true");
}

/** Clear active demo tab flag when leaving Preview Tool (not on refresh). */
export function endGuestDemoSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GUEST_DEMO_ACTIVE_KEY);
}

export function markPreviewToolRefresh() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GUEST_DEMO_REFRESH_KEY, "1");
}

export function consumePreviewToolRefresh() {
  if (typeof window === "undefined") return false;
  const refreshing = sessionStorage.getItem(GUEST_DEMO_REFRESH_KEY) === "1";
  if (refreshing) sessionStorage.removeItem(GUEST_DEMO_REFRESH_KEY);
  return refreshing;
}



export function isDemoEntry(searchParams) {

  return searchParams?.get("demo") === "1";

}



export function resetPreviewToolForDemo() {

  if (typeof window === "undefined") return;



  const keysToRemove = [

    "adigator_workflow_v1",

    "adigator_analysis_result_v1",

    "adigator_platform",

    "adigator_goal",

    "adigator_vertical",

    "adigator_audience_stage",

    "adigator_analysis_session_id",

  ];



  keysToRemove.forEach((key) => localStorage.removeItem(key));

}



export async function canAccessPreviewTool() {

  if (isLocalDevHost()) {
    clearGuestDemoRestriction();
    return { allowed: true, reason: "local_dev_unlimited" };
  }

  const authed = await isAuthenticatedUser();
  if (authed) {
    clearGuestDemoRestriction();
    return { allowed: true, reason: "authenticated" };
  }

  if (!hasFirebaseClientConfig()) {
    return { allowed: true, reason: "local_dev_fallback" };
  }



  if (hasGuestDemoBeenUsed() && !isGuestDemoSessionActive()) {

    return { allowed: false, reason: "demo_exhausted" };

  }



  return { allowed: true, reason: hasGuestDemoBeenUsed() ? "guest_demo_active" : "guest_demo_new" };

}



/** @deprecated use enterGuestDemoSession */

export function markGuestDemoUsed() {

  enterGuestDemoSession();

}



/** @deprecated */

export function markGuestDemoStarted() {

  enterGuestDemoSession();

}

