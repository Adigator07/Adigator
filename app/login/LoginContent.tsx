"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BugOff,
  ChevronDown,
  Loader2,
  Check,
  Rocket,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import {
  browserLocalPersistence,
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";
import {
  GENERIC_AUTH_VALIDATION_ERROR,
  GENERIC_SIGNUP_RESPONSE_MESSAGE,
  LOGIN_ACCOUNT_DISABLED_ERROR,
  LOGIN_INCORRECT_CREDENTIALS_ERROR,
  LOGIN_PENDING_APPROVAL_ERROR,
  LOGIN_SERVER_ERROR,
  PASSWORD_RESET_REQUEST_MESSAGE,
  SIGNUP_PENDING_APPROVAL_MESSAGE,
} from "@/app/lib/auth/constants";
import {
  getLoginBlockMessage,
  isAccountLoginAllowed,
  type AccountStatus,
} from "@/app/lib/auth/accountStatus";
import { REGISTRATION_ROLES, getPostAuthRedirect } from "@/app/lib/communications/roleLabels";
import type { UserRole } from "@/app/lib/communications/types";
import { DISPLAY_NAME_PATTERN } from "@/app/lib/auth/sanitize";
import {
  getFirebaseClientAuthOrNull,
  getFirebaseClientFirestoreOrNull,
  hasFirebaseClientConfig,
} from "@/app/lib/firebase/client";

const FIREBASE_CONFIG_ERROR =
  "Authentication is not configured yet. Add the Firebase environment variables and restart the app.";
import { getClientProfileData } from "@/app/lib/firestore/clientProfiles";
import {
  GoogleAdsIcon,
  MetaIcon,
  TradeDeskIcon,
} from "@/app/components/brand/PlatformBrandIcons";

type RegisterRole = Extract<UserRole, "usa_client" | "end_client">;

type FieldErrors = {
  form?: string;
};

type PendingGoogleProfile = {
  uid: string;
  email: string | null;
  role: RegisterRole;
};

const VALIDATION_STATS = [
  {
    title: "Campaign Validation",
    value: "48 Campaigns Validated",
    accent: "text-emerald-600",
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-200/80",
    Icon: BadgeCheck,
    check: true,
  },
  {
    title: "Launch Ready",
    value: "96% Average Readiness Score",
    accent: "text-sky-600",
    iconWrap: "bg-sky-50 text-sky-600 ring-sky-200/80",
    Icon: Rocket,
    check: false,
  },
  {
    title: "Budget Risk",
    value: "-$14,800 Potential Waste Prevented",
    accent: "text-amber-600",
    iconWrap: "bg-amber-50 text-amber-600 ring-amber-200/80",
    Icon: Wallet,
    check: false,
  },
  {
    title: "Issues Prevented",
    value: "127 Critical Issues Fixed",
    accent: "text-violet-600",
    iconWrap: "bg-violet-50 text-violet-600 ring-violet-200/80",
    Icon: BugOff,
    check: false,
  },
] as const;

const PLATFORM_OPTION_MOTION = {
  google_ads: {
    initial: { opacity: 0, x: -28, rotate: -4, scale: 0.94 },
    animate: { opacity: 1, x: 0, rotate: 0, scale: 1 },
    exit: { opacity: 0, x: -16, rotate: -3, scale: 0.96 },
    transition: { type: "spring", stiffness: 420, damping: 28, mass: 0.7 },
  },
  meta: {
    initial: { opacity: 0, y: 22, scale: 0.82 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 12, scale: 0.9 },
    transition: { type: "spring", stiffness: 380, damping: 22, mass: 0.65 },
  },
  programmatic: {
    initial: { opacity: 0, x: 28, rotateX: 55, transformPerspective: 700 },
    animate: { opacity: 1, x: 0, rotateX: 0, transformPerspective: 700 },
    exit: { opacity: 0, x: 18, rotateX: 35, transformPerspective: 700 },
    transition: { type: "spring", stiffness: 340, damping: 26, mass: 0.75 },
  },
} as const;

const inputClassName =
  "h-[3.25rem] w-full rounded-xl border border-[#E8E6DF] bg-white/90 px-4 text-[15px] text-[#0D0D0D] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0D0D0D]/30 focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,13,13,0.06)]";

const shellVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const panelSlideVariants: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const heroCardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const panelSlideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const statGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const statCardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

type HiTechInputProps = {
  id: string;
  type: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
};

export default function LoginContent() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const isRegisterMode = searchParams.get("mode") === "register";
  const isResetMode = searchParams.get("reset") === "1";
  const isPendingQuery = searchParams.get("pending") === "1";
  const isDisabledQuery = searchParams.get("disabled") === "1";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("usa_client");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleUsername, setGoogleUsername] = useState("");
  const [googleUsernameError, setGoogleUsernameError] = useState<string | null>(null);
  const [googleUsernameSaving, setGoogleUsernameSaving] = useState(false);
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<PendingGoogleProfile | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);
  const [submitPulse, setSubmitPulse] = useState(false);
  const [platformMenuOpen, setPlatformMenuOpen] = useState(true);
  const [footerPlatformMenuOpen, setFooterPlatformMenuOpen] = useState(true);
  const queryStatusError = isPendingQuery
    ? LOGIN_PENDING_APPROVAL_ERROR
    : isDisabledQuery
      ? LOGIN_ACCOUNT_DISABLED_ERROR
      : null;
  const finalizingRef = useRef(false);
  const redirectedRef = useRef(false);
  const submitPulseTimeoutRef = useRef<number | null>(null);

  function authDebug(event: string, data?: Record<string, unknown>) {
    try {
      console.info("[AUTH_LOGIN]", event, {
        ts: new Date().toISOString(),
        path: window.location.pathname,
        ...data,
      });
    } catch {
      // Ignore logging failures.
    }
  }

  async function getRoleAndStatus(uid: string): Promise<{ role: RegisterRole; status: AccountStatus | null }> {
    const data = await getClientProfileData<{ role?: string; status?: AccountStatus }>(uid);
    const role = (data?.role === "usa_client" ? "usa_client" : "end_client") as RegisterRole;
    const status = (data?.status as AccountStatus | undefined) ?? null;
    return { role, status };
  }

  async function getRoleAndStatusFast(
    uid: string,
    fallbackRole: RegisterRole = "end_client",
    timeoutMs = 100,
  ): Promise<{ role: RegisterRole; status: AccountStatus | null }> {
    const timeout = new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    });

    const data = await Promise.race([
      getClientProfileData<{ role?: string; status?: AccountStatus }>(uid),
      timeout,
    ]);

    const role = data?.role === "usa_client" ? "usa_client" : fallbackRole;
    const status = (data?.status as AccountStatus | undefined) ?? null;
    return { role, status };
  }

  async function finalizeSignedInUser(resolvedUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    providerIds: string[];
  }) {
    if (redirectedRef.current || finalizingRef.current) return;
    finalizingRef.current = true;
    authDebug("finalize_start", { uid: resolvedUser.uid, hasEmail: Boolean(resolvedUser.email) });

    const auth = getFirebaseClientAuthOrNull();
    if (!auth) {
      setErrors({ form: FIREBASE_CONFIG_ERROR });
      finalizingRef.current = false;
      return;
    }
    const firestore = getFirebaseClientFirestoreOrNull();
    const profileRef = firestore ? doc(firestore, "userProfiles", resolvedUser.uid) : null;
    const profile = await Promise.race([
      getClientProfileData<{
        role?: string;
        status?: AccountStatus;
        username?: string;
        fullName?: string;
      }>(resolvedUser.uid),
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), 1200);
      }),
    ]);
    const shouldActivateProfile = !profile || profile.status === "pending_verification";
      const hasSavedUsername = Boolean(String(profile?.username || profile?.fullName || "").trim());
      const isGoogleAccount = resolvedUser.providerIds.includes("google.com");
      authDebug("profile_resolved", {
        hasProfile: Boolean(profile),
        status: profile?.status ?? null,
        role: profile?.role ?? null,
        hasSavedUsername,
        isGoogleAccount,
        shouldActivateProfile,
      });
    try {
      if (shouldActivateProfile && profileRef) {
        const resolvedName = resolvedUser.displayName || resolvedUser.email?.split("@")[0] || `user-${resolvedUser.uid.slice(0, 6)}`;
        // Do not block dashboard redirect on profile write when the network is unstable.
        void Promise.race([
          setDoc(profileRef, {
            email: resolvedUser.email || "",
            username: resolvedName,
            fullName: resolvedName,
            role: "end_client",
            status: "active",
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          }, { merge: true }),
          new Promise<void>((resolve) => {
            window.setTimeout(() => resolve(), 1000);
          }),
        ]).catch(() => {
          // Keep going if Firestore is briefly unavailable.
        });

        if (!resolvedUser.displayName && auth.currentUser) {
          void updateProfile(auth.currentUser, { displayName: resolvedName }).catch(() => {});
        }
      } else if (shouldActivateProfile) {
        authDebug("firestore_profile_write_skipped", { uid: resolvedUser.uid });
      }

      const resolvedRole = (profile?.role === "usa_client" ? "usa_client" : "end_client") as RegisterRole;
      const accountStatus = shouldActivateProfile ? "active" : ((profile?.status as AccountStatus | undefined) ?? null);
      if (accountStatus && !isAccountLoginAllowed(accountStatus)) {
        authDebug("blocked_status", { accountStatus });
        await signOut(auth);
        setErrors({ form: getLoginBlockMessage(accountStatus) });
        setGoogleLoading(false);
        return;
      }

      if (isGoogleAccount && !hasSavedUsername) {
        authDebug("google_profile_autofill", { uid: resolvedUser.uid });
      }

      setSuccess(true);
      redirectedRef.current = true;
      const destination = getPostAuthRedirect(resolvedRole);
      authDebug("redirecting", { destination, resolvedRole, accountStatus });

      try {
        router.replace(destination);
      } catch (error) {
        authDebug("router_replace_failed", { message: error instanceof Error ? error.message : "unknown" });
      }

      const forceNavigate = () => {
        if (window.location.pathname === "/login") {
          authDebug("router_fallback_assign", { destination });
          window.location.assign(destination);
        }
      };

      window.setTimeout(forceNavigate, 300);
      window.setTimeout(forceNavigate, 1200);
    } finally {
      authDebug("finalize_end");
      finalizingRef.current = false;
    }
  }

  useEffect(() => {
    if (!hasFirebaseClientConfig()) {
      authDebug("firebase_config_missing");
      setErrors({ form: FIREBASE_CONFIG_ERROR });
      return;
    }

    const auth = getFirebaseClientAuthOrNull();
    if (!auth) return;

    authDebug("persistence_init");
    void setPersistence(auth, browserLocalPersistence).catch(() => {
      // Keep default persistence if the browser blocks persistence APIs.
      authDebug("persistence_failed");
    });
  }, []);

  useEffect(() => {
    if (!hasFirebaseClientConfig()) return;

    const auth = getFirebaseClientAuthOrNull();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      authDebug("onAuthStateChanged", { hasUser: Boolean(user), uid: user?.uid ?? null });
      if (!user) {
        setPendingGoogleProfile(null);
        setGoogleUsernameError(null);
        setGoogleLoading(false);
        return;
      }
      void finalizeSignedInUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerIds: user.providerData.map((provider) => provider.providerId),
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasFirebaseClientConfig()) return;

    let active = true;

    void (async () => {
      const auth = getFirebaseClientAuthOrNull();
      if (!auth) return;

      authDebug("redirect_result_start");
      try {
        const redirectResult = await Promise.race([
          getRedirectResult(auth),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 5000);
          }),
        ]);
        const result = redirectResult;
        const user = result?.user;
        const resolvedUser = user || auth.currentUser;
        authDebug("redirect_result_done", {
          hasResultUser: Boolean(user),
          hasCurrentUser: Boolean(auth.currentUser),
          resolvedUid: resolvedUser?.uid ?? null,
        });
        if (!active || !resolvedUser) return;
        await finalizeSignedInUser({
          uid: resolvedUser.uid,
          email: resolvedUser.email,
          displayName: resolvedUser.displayName,
          providerIds: resolvedUser.providerData.map((provider) => provider.providerId),
        });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Google sign-in failed.";
        authDebug("redirect_result_error", { message });
        setErrors({ form: message });
      } finally {
        authDebug("redirect_result_finalize");
        if (active) setGoogleLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const leftEyebrow = isResetMode ? "Password recovery" : isRegisterMode ? "Create account" : "Welcome back";
  const leftTitle = isResetMode
    ? "Reset your password"
    : isRegisterMode
      ? "Create your account"
      : "Bring your best campaigns to life";
  const leftSubtitle = isResetMode
    ? "We will send a secure link to your inbox."
    : isRegisterMode
      ? "Join Adigator and move from brief to launch with clarity and confidence."
      : "A cleaner way to validate ideas, monitor performance, and launch with confidence.";
  const formTitle = isResetMode ? "Reset password" : isRegisterMode ? "Register" : "Log in";
  const submitLabel = isResetMode ? "Send reset link" : isRegisterMode ? "Register" : "Log in";
  const shouldReduceMotion = Boolean(reduceMotion);

  const renderHiTechInput = ({ id, type, autoComplete, value, onChange, label, className }: HiTechInputProps) => (
    <div className="agi-input-wrap">
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClassName} agi-input-hitech ${className ?? ""}`}
        placeholder=" "
      />
      <label htmlFor={id} className="agi-input-label">
        {label}
      </label>
    </div>
  );

  const logOutboundGoogleAdsClick = async (source: string, destination = "google_ads_start") => {
    try {
      const user = getFirebaseClientAuthOrNull()?.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      if (!token) return;

      await fetch("/api/activity/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action_type: "google_ads_outbound_click",
          action_label: "Google Ads outbound redirect",
          metadata: {
            source,
            via: "link",
            destination,
          },
        }),
      });
    } catch {
      // Best-effort logging only; never block outbound navigation.
    }
  };

  const openPlatformFromLogin = async (platform: "google_ads" | "meta" | "programmatic", source: string) => {
    const destinations = {
      google_ads: "https://ads.google.com/aw/accounts",
      meta: "https://www.facebook.com/adsmanager",
      programmatic: "https://www.thetradedesk.com/us/login",
    } as const;

    const destination = destinations[platform];

    const openDestination = (url: string) => {
      try {
        const tab = window.open(url, "_blank", "noopener,noreferrer");
        if (tab) {
          tab.opener = null;
          return tab;
        }
      } catch {
        // Fall back to same-tab navigation if the popup is blocked.
      }

      window.location.assign(url);
      return null;
    };

    try {
      void logOutboundGoogleAdsClick(source, `${platform}_direct_open`);
      openDestination(destination);
    } catch {
      openDestination(destination);
    }
  };

  const triggerSubmitPulse = () => {
    if (shouldReduceMotion) return;
    setSubmitPulse(false);
    window.requestAnimationFrame(() => {
      setSubmitPulse(true);
      if (submitPulseTimeoutRef.current !== null) {
        window.clearTimeout(submitPulseTimeoutRef.current);
      }
      submitPulseTimeoutRef.current = window.setTimeout(() => {
        setSubmitPulse(false);
        submitPulseTimeoutRef.current = null;
      }, 420);
    });
  };

  const platformOptions = [
    {
      key: "google_ads" as const,
      label: "Google Ads",
      subtitle: "Ads Manager workspace",
      ctaLabel: "Open Google Ads",
      icon: <GoogleAdsIcon className="h-7 w-7" />,
      iconBg: "bg-white",
      tint: "from-blue-500/15 via-sky-400/10 to-transparent",
      ring: "ring-blue-200/80",
    },
    {
      key: "meta" as const,
      label: "Meta",
      subtitle: "Ads Manager & campaigns",
      ctaLabel: "Open Meta Ads",
      icon: <MetaIcon className="h-7 w-7" />,
      iconBg: "bg-white",
      tint: "from-[#0081FB]/15 via-indigo-400/10 to-transparent",
      ring: "ring-indigo-200/80",
    },
    {
      key: "programmatic" as const,
      label: "Programmatic",
      subtitle: "Trade Desk login",
      ctaLabel: "Open Trade Desk",
      icon: <TradeDeskIcon className="h-7 w-7" />,
      iconBg: "bg-white",
      tint: "from-neutral-500/10 via-rose-400/10 to-transparent",
      ring: "ring-neutral-200/80",
    },
  ];

  function renderPlatformLauncher({
    open,
    onToggle,
    source,
    compact = false,
  }: {
    open: boolean;
    onToggle: () => void;
    source: string;
    compact?: boolean;
  }) {
    return (
      <div className={compact ? "relative" : "relative mb-4"}>
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className={`group relative w-full overflow-hidden text-left transition ${
            compact
              ? "rounded-3xl border border-[#E8E6DF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F5EF_100%)] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5"
              : "rounded-3xl border border-white/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-px shadow-[0_18px_55px_rgba(0,0,0,0.12)] backdrop-blur-md"
          }`}
        >
          {compact ? (
            <>
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,212,255,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_42%)]" />
              <span className="relative flex w-full items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E8E6DF] bg-white/80 shadow-sm">
                    <span className="flex -space-x-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                        <GoogleAdsIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                        <MetaIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                        <TradeDeskIcon className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </span>
                  <span className="ml-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">Quick access</span>
                    <span className="mt-1 block text-sm font-semibold text-[#0D0D0D]">
                      {open ? "Pick a platform below" : "Open platform options"}
                    </span>
                  </span>
                </span>
                <span className="relative inline-flex items-center gap-2 rounded-full bg-[#0D0D0D] px-3 py-2 text-sm font-semibold text-white">
                  {open ? "Close" : "Options"}
                  <ChevronDown size={14} className={`transition duration-300 ${open ? "rotate-180" : ""}`} />
                </span>
              </span>
            </>
          ) : (
            <span className="block rounded-[23px] bg-[linear-gradient(120deg,rgba(255,255,255,0.96),rgba(232,245,255,0.94),rgba(220,242,255,0.9))] p-4 sm:p-5">
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Launch faster</span>
                  <span className="mt-2 block text-lg font-semibold text-slate-900">Open a platform workspace</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                  options
                  <ChevronDown
                    size={12}
                    className={`transition duration-300 ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </span>
              </span>
              <span className="mt-4 flex items-center gap-2">
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-sm">
                  <span className="flex -space-x-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                      <GoogleAdsIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                      <MetaIcon className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </span>
                <span className="ml-2 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition group-hover:bg-white">
                  {open ? "Hide platforms" : "Choose platform"}
                  <ArrowRight size={14} className={`shrink-0 transition duration-300 ${open ? "rotate-90" : ""}`} />
                </span>
              </span>
            </span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key={`${source}-options`}
              initial={shouldReduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid gap-2 [perspective:900px]">
                {platformOptions.map((option, index) => {
                  const motionPreset = PLATFORM_OPTION_MOTION[option.key];
                  return (
                    <motion.button
                      key={option.key}
                      type="button"
                      initial={shouldReduceMotion ? false : motionPreset.initial}
                      animate={motionPreset.animate}
                      exit={shouldReduceMotion ? undefined : motionPreset.exit}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.2 }
                          : { ...motionPreset.transition, delay: index * 0.07 }
                      }
                      onClick={() => {
                        void openPlatformFromLogin(option.key, source);
                      }}
                      className={`group/option relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ${option.ring} transition hover:-translate-y-0.5 hover:bg-white`}
                      style={{ transformOrigin: "50% 0%" }}
                    >
                      <span className={`pointer-events-none absolute inset-0 bg-linear-to-br ${option.tint}`} aria-hidden />
                      <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm ${option.iconBg}`}>
                        {option.icon}
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{option.subtitle}</span>
                      </span>
                      <span className="relative inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition group-hover/option:bg-slate-900 group-hover/option:text-white">
                        Open
                        <ArrowRight size={12} aria-hidden />
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  useEffect(() => {
    return () => {
      if (submitPulseTimeoutRef.current !== null) {
        window.clearTimeout(submitPulseTimeoutRef.current);
      }
    };
  }, []);


  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResetMessage(null);
    setErrors({});

    try {
      const trimmed = resetEmail.trim();
      if (!trimmed) {
        setErrors({ form: GENERIC_AUTH_VALIDATION_ERROR });
        return;
      }
      const auth = getFirebaseClientAuthOrNull();
      if (!auth) {
        setErrors({ form: FIREBASE_CONFIG_ERROR });
        return;
      }
      triggerSubmitPulse();
      await sendPasswordResetEmail(auth, trimmed);
      setResetMessage(PASSWORD_RESET_REQUEST_MESSAGE);
    } catch {
      setResetMessage(PASSWORD_RESET_REQUEST_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (isRegisterMode) {
      if (!trimmedUsername || !trimmedEmail || !password.trim() || !confirmPassword.trim() || !selectedRole) {
        nextErrors.form = GENERIC_AUTH_VALIDATION_ERROR;
      } else if (password.trim() !== confirmPassword.trim()) {
        nextErrors.form = GENERIC_AUTH_VALIDATION_ERROR;
      }
    } else if (!trimmedEmail || !password.trim()) {
      nextErrors.form = LOGIN_INCORRECT_CREDENTIALS_ERROR;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    triggerSubmitPulse();
    setLoading(true);
    setErrors({});
    setSignupSuccessMessage(null);

    try {
      const auth = getFirebaseClientAuthOrNull();
      if (!auth) {
        setErrors({ form: FIREBASE_CONFIG_ERROR });
        return;
      }
      const db = getFirebaseClientFirestoreOrNull();

      if (isRegisterMode) {
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(credential.user, { displayName: trimmedUsername });

        if (db) {
          try {
            await setDoc(doc(db, "userProfiles", credential.user.uid), {
              email: trimmedEmail,
              fullName: trimmedUsername,
              role: selectedRole,
              status: "pending_verification",
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            }, { merge: true });
          } catch {
            // Continue with auth so the user can still sign in if Firestore is temporarily unavailable.
          }
        }

        await signOut(auth);

        setSignupSuccessMessage(SIGNUP_PENDING_APPROVAL_MESSAGE);
        setPassword("");
        setConfirmPassword("");
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const user = credential.user;
      if (!user) {
        setErrors({ form: LOGIN_INCORRECT_CREDENTIALS_ERROR });
        return;
      }

      const { role: resolvedRole, status: accountStatus } = await getRoleAndStatus(user.uid);
      if (accountStatus && !isAccountLoginAllowed(accountStatus)) {
        await signOut(auth);
        setErrors({ form: getLoginBlockMessage(accountStatus) });
        return;
      }

      setSuccess(true);
      const destination = getPostAuthRedirect(resolvedRole);
      const navigateToDashboard = () => {
        if (window.location.pathname === "/login") {
          window.location.assign(destination);
        } else {
          router.replace(destination);
        }
      };
      window.setTimeout(navigateToDashboard, 500);
    } catch {
      setErrors({
        form: isRegisterMode ? GENERIC_SIGNUP_RESPONSE_MESSAGE : LOGIN_SERVER_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    authDebug("google_click");
    setErrors({});
    setSignupSuccessMessage(null);
    setPendingGoogleProfile(null);
    setGoogleUsernameError(null);
    setGoogleUsername("");
    setPassword("");
    setConfirmPassword("");
    setGoogleLoading(true);

    try {
      const auth = getFirebaseClientAuthOrNull();
      if (!auth) {
        setErrors({ form: FIREBASE_CONFIG_ERROR });
        setGoogleLoading(false);
        return;
      }
      await setPersistence(auth, browserLocalPersistence).catch(() => {
        // Continue with default persistence when browser restrictions apply.
      });
      const provider = new GoogleAuthProvider();
      const loginHint = email.trim();
      provider.setCustomParameters({
        prompt: "select_account",
        ...(loginHint ? { login_hint: loginHint } : {}),
      });
      authDebug("popup_start");
      const result = await signInWithPopup(auth, provider);
      const user = result?.user;
      authDebug("popup_done", { uid: user?.uid ?? null, email: user?.email ?? null });
      if (!user) {
        throw new Error("Google sign-in was cancelled.");
      }
      await finalizeSignedInUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerIds: user.providerData.map((provider) => provider.providerId),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed.";
      authDebug("google_signin_error", { message });
      setErrors({ form: message });
      setGoogleLoading(false);
    }
  };

  const handleGoogleUsernameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingGoogleProfile) return;

    const trimmedUsername = googleUsername.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedUsername || trimmedUsername.length < 2 || !DISPLAY_NAME_PATTERN.test(trimmedUsername)) {
      setGoogleUsernameError("Please enter a valid username.");
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 8) {
      setGoogleUsernameError("Please choose a password with at least 8 characters.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setGoogleUsernameError("The passwords do not match.");
      return;
    }

    setGoogleUsernameError(null);
    setGoogleUsernameSaving(true);
    triggerSubmitPulse();

    try {
      const auth = getFirebaseClientAuthOrNull();
      if (!auth) {
        setGoogleUsernameError(FIREBASE_CONFIG_ERROR);
        return;
      }
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== pendingGoogleProfile.uid) {
        throw new Error("Your Google session changed. Please sign in again.");
      }

      const email = currentUser.email || pendingGoogleProfile.email || "";
      if (!email) {
        throw new Error("We could not find your Google email. Please sign in again.");
      }

      const hasPasswordProvider = (currentUser.providerData || []).some((provider) => provider.providerId === "password");
      if (hasPasswordProvider) {
        await updatePassword(currentUser, trimmedPassword);
      } else {
        const credential = EmailAuthProvider.credential(email, trimmedPassword);
        await linkWithCredential(currentUser, credential);
      }

      await updateProfile(currentUser, { displayName: trimmedUsername });
      const firestore = getFirebaseClientFirestoreOrNull();
      if (firestore) {
        await setDoc(doc(firestore, "userProfiles", currentUser.uid), {
          email,
          username: trimmedUsername,
          fullName: trimmedUsername,
          role: pendingGoogleProfile.role,
          status: "active",
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      setPendingGoogleProfile(null);
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      redirectedRef.current = true;
      const destination = getPostAuthRedirect(pendingGoogleProfile.role);
      const forceNavigate = () => {
        if (window.location.pathname === "/login") {
          window.location.assign(destination);
        } else {
          router.replace(destination);
        }
      };
      forceNavigate();
      window.setTimeout(forceNavigate, 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save your account details.";
      setGoogleUsernameError(message);
    } finally {
      setGoogleUsernameSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#f4f7fb_100%)] text-[#0D0D0D]">
      <div className="agi-login-grid" aria-hidden />
      <div className="agi-login-scan" aria-hidden />
      <div className="agi-login-orb agi-login-orb--a" aria-hidden />
      <div className="agi-login-orb agi-login-orb--b" aria-hidden />

      <motion.div
        className="relative z-10 grid min-h-screen lg:grid-cols-2"
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
        variants={shouldReduceMotion ? undefined : shellVariants}
      >
        {/* Left — brand panel */}
        <motion.section
          className="agi-login-panel relative hidden flex-col justify-between overflow-hidden border-r border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(233,245,255,0.95)_38%,rgba(220,242,255,0.94)_100%)] px-10 py-12 text-slate-900 lg:flex xl:px-14 xl:py-16"
          variants={shouldReduceMotion ? undefined : panelSlideLeftVariants}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(59,130,246,0.12),transparent_58%),radial-gradient(ellipse_at_82%_100%,rgba(16,185,129,0.12),transparent_46%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.45] bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-size-[64px_64px]" />
          <div className="pointer-events-none absolute inset-y-0 -right-32 w-[16rem] bg-[radial-gradient(circle,rgba(14,165,233,0.18),transparent_70%)] blur-3xl" />

          <motion.div className="relative z-10" variants={shouldReduceMotion ? undefined : panelVariants}>
            <Link href="/" className="text-[1.35rem] font-black tracking-[-0.03em] text-slate-900">
              Adigator
            </Link>
          </motion.div>

          <motion.div className="relative z-10 max-w-lg" variants={shouldReduceMotion ? undefined : panelVariants}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{leftEyebrow}</p>
            <h1 className="mt-5 text-[clamp(2.25rem,4vw,3.25rem)] font-black leading-[1.02] tracking-[-0.04em] text-slate-900">
              {leftTitle}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">{leftSubtitle}</p>

            <motion.div
              className="relative mt-8 w-full max-w-135 self-start"
              variants={shouldReduceMotion ? undefined : heroCardVariants}
            >
              <div className="agi-login-hero-glow absolute inset-x-8 top-6 h-[72%] rounded-full" aria-hidden />
              <motion.div
                initial={shouldReduceMotion ? false : { y: 18, opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(232,245,255,0.94),rgba(255,255,255,0.9))] p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] ${shouldReduceMotion ? "" : "agi-login-hero-float"}`}
              >
                <img
                  src="/assets/illustrations/storyset/analysis-amico.svg"
                  alt="Adigator dashboard illustration"
                  className="agi-login-hero-illustration w-full rounded-[20px]"
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            </motion.div>

            <p className="mt-10 text-lg font-bold leading-snug tracking-tight text-slate-900 sm:text-xl">
              Launch with confidence. Not assumptions.
            </p>

            <motion.div
              className="mt-8 grid grid-cols-2 gap-4"
              variants={shouldReduceMotion ? undefined : statGridVariants}
            >
              {VALIDATION_STATS.map((stat) => {
                const StatIcon = stat.Icon;
                return (
                <motion.div
                  key={stat.title}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                  variants={shouldReduceMotion ? undefined : statCardVariants}
                  whileHover={shouldReduceMotion ? undefined : { y: -4, borderColor: "rgba(148,163,184,0.55)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{stat.title}</p>
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${stat.iconWrap}`}>
                      <StatIcon size={18} aria-hidden />
                    </span>
                  </div>
                  <p className={`mt-3 text-[15px] font-bold leading-snug ${stat.accent}`}>
                    {stat.check ? (
                      <span className="inline-flex items-start gap-1.5">
                        <Check size={16} className="mt-0.5 shrink-0" aria-hidden />
                        {stat.value}
                      </span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div className="relative z-10" variants={shouldReduceMotion ? undefined : panelVariants}>
            <motion.div variants={shouldReduceMotion ? undefined : heroCardVariants}>
              {renderPlatformLauncher({
                open: platformMenuOpen,
                onToggle: () => setPlatformMenuOpen((prev) => !prev),
                source: "login-left-panel",
              })}
            </motion.div>

            <p className="text-sm text-slate-600">
              {isRegisterMode ? "Already have an account?" : "New to Adigator?"}{" "}
              <Link
                href={isRegisterMode ? "/login" : "/login?mode=register"}
                className="font-semibold text-slate-800 transition hover:text-slate-950"
              >
                {isRegisterMode ? "Log in" : "Register"}
              </Link>
              {" or "}
              <Link href={MARKETING_CTA.href} className="inline-flex items-center gap-1 font-semibold text-slate-800 transition hover:text-slate-950">
                {MARKETING_CTA.label}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </p>
          </motion.div>
        </motion.section>

        {/* Right — form panel */}
        <motion.section
          className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20"
          variants={shouldReduceMotion ? undefined : panelSlideVariants}
        >
          <motion.div
            className="agi-login-form-shell w-full max-w-105"
            variants={shouldReduceMotion ? undefined : panelVariants}
          >
            <div className="mb-10 lg:hidden">
              <Link href="/" className="text-xl font-black tracking-tight text-[#0D0D0D]">
                Adigator
              </Link>
            </div>

            <h2 className="text-[clamp(2rem,5vw,2.75rem)] font-black tracking-[-0.04em] text-[#0D0D0D]">
              {pendingGoogleProfile ? "Complete your account" : formTitle}
            </h2>

            {pendingGoogleProfile ? (
              <form onSubmit={handleGoogleUsernameSubmit} noValidate className="mt-10 space-y-4">
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  Your Google account is connected. Choose a display name and create a password so you can sign in with email later too.
                </p>

                {pendingGoogleProfile.email ? (
                  <p className="rounded-xl border border-[#E8E6DF] bg-white/80 px-4 py-3 text-sm text-[#4B5563]">
                    Email: <span className="font-semibold text-[#0D0D0D]">{pendingGoogleProfile.email}</span>
                  </p>
                ) : null}

                {renderHiTechInput({
                  id: "google-username",
                  type: "text",
                  autoComplete: "username",
                  value: googleUsername,
                  onChange: setGoogleUsername,
                  label: "Username",
                })}

                {renderHiTechInput({
                  id: "google-password",
                  type: "password",
                  autoComplete: "new-password",
                  value: password,
                  onChange: setPassword,
                  label: "Create password",
                })}

                {renderHiTechInput({
                  id: "google-confirm-password",
                  type: "password",
                  autoComplete: "new-password",
                  value: confirmPassword,
                  onChange: setConfirmPassword,
                  label: "Confirm password",
                })}

                {googleUsernameError ? (
                  <p className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {googleUsernameError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={googleUsernameSaving}
                  className={`mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(13,13,13,0.18)] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60 ${submitPulse ? "agi-submit-pulse" : ""}`}
                >
                  {googleUsernameSaving ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                  {googleUsernameSaving ? "Saving…" : "Create password & continue"}
                </button>
              </form>
            ) : isResetMode ? (
              <form onSubmit={handlePasswordReset} noValidate className="mt-10 space-y-4">
                {renderHiTechInput({
                  id: "reset-email",
                  type: "email",
                  autoComplete: "email",
                  value: resetEmail,
                  onChange: setResetEmail,
                  label: "Email",
                })}

                {resetMessage ? (
                  <p className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {resetMessage}
                  </p>
                ) : null}

                {errors.form || queryStatusError ? (
                  <p className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">{errors.form || queryStatusError}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(13,13,13,0.18)] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60 ${submitPulse ? "agi-submit-pulse" : ""}`}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                  {loading ? "Sending…" : submitLabel}
                </button>

                <p className="pt-4 text-center text-sm text-[#6B7280]">
                  <Link href="/login" className="font-semibold text-[#0D0D0D] hover:underline">
                    Back to log in
                  </Link>
                </p>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-4">
                  {isRegisterMode ? (
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#E8E6DF] bg-[#FAFAF7] p-1">
                      {REGISTRATION_ROLES.map((option) => {
                        const active = selectedRole === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSelectedRole(option.value as RegisterRole)}
                            className={`rounded-lg px-3 py-2.5 text-left text-xs transition ${
                              active
                                ? "bg-white text-[#0D0D0D] shadow-sm"
                                : "text-[#6B7280] hover:text-[#0D0D0D]"
                            }`}
                          >
                            <span className="block font-semibold">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {isRegisterMode ? (
                    renderHiTechInput({
                      id: "username",
                      type: "text",
                      autoComplete: "username",
                      value: username,
                      onChange: setUsername,
                      label: "Username",
                    })
                  ) : null}

                  {renderHiTechInput({
                    id: "email",
                    type: "email",
                    autoComplete: "email",
                    value: email,
                    onChange: setEmail,
                    label: "Email",
                  })}

                  <div className="agi-input-wrap agi-input-wrap--password relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isRegisterMode ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClassName} agi-input-hitech pr-16`}
                      placeholder=" "
                    />
                    <label htmlFor="password" className="agi-input-label">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280] transition hover:text-[#0D0D0D]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {isRegisterMode ? (
                    renderHiTechInput({
                      id: "confirm-password",
                      type: showPassword ? "text" : "password",
                      autoComplete: "new-password",
                      value: confirmPassword,
                      onChange: setConfirmPassword,
                      label: "Confirm password",
                    })
                  ) : null}

                  {!isRegisterMode ? (
                    <div className="flex justify-end pt-1">
                      <Link href="/login?reset=1" className="text-xs font-medium text-[#6B7280] transition hover:text-[#0D0D0D]">
                        Forgot password?
                      </Link>
                    </div>
                  ) : null}

                  {signupSuccessMessage ? (
                    <p className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {signupSuccessMessage}
                    </p>
                  ) : null}

                  {errors.form || queryStatusError ? (
                    <p className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">{errors.form || queryStatusError}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || googleLoading || success}
                    className={`mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(13,13,13,0.18)] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60 ${submitPulse ? "agi-submit-pulse" : ""}`}
                  >
                    {success ? <Check size={18} aria-hidden /> : loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                    {success ? "Success" : loading ? "Please wait…" : submitLabel}
                  </button>

                  {!isRegisterMode ? (
                    <>
                      <div className="my-1 flex items-center gap-3">
                        <div className="h-px flex-1 bg-[#E8E6DF]" />
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">or</span>
                        <div className="h-px flex-1 bg-[#E8E6DF]" />
                      </div>
                      <button
                        type="button"
                        onClick={() => { void handleGoogleLogin(); }}
                        disabled={loading || googleLoading || success}
                        className="mt-1 flex h-13 w-full items-center justify-center gap-3 rounded-full border border-[#DAD8D2] bg-white text-[15px] font-semibold text-[#0D0D0D] shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F7F7F3] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                            <path fill="#4285F4" d="M21.6 12.23c0-.79-.07-1.54-.2-2.27H12v4.3h5.39a4.61 4.61 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.99-4.33 2.99-7.56Z" />
                            <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.61-2.41l-3.24-2.5c-.89.6-2.03.96-3.37.96-2.59 0-4.79-1.75-5.57-4.1H3.07v2.57A10 10 0 0 0 12 22Z" />
                            <path fill="#FBBC05" d="M6.43 13.95A6.02 6.02 0 0 1 6.43 8.05V5.48H3.07a10 10 0 0 0 0 16.94l3.36-2.57Z" />
                            <path fill="#EA4335" d="M12 6.04c1.46 0 2.77.5 3.8 1.48l2.84-2.84A9.96 9.96 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.36 2.57C7.21 7.79 9.41 6.04 12 6.04Z" />
                          </svg>
                        </span>
                        {googleLoading ? "Connecting to Google…" : "Continue with Google"}
                      </button>
                    </>
                  ) : null}
                </form>

                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-10"
                >
                  {renderPlatformLauncher({
                    open: footerPlatformMenuOpen,
                    onToggle: () => setFooterPlatformMenuOpen((prev) => !prev),
                    source: "login-form-footer",
                    compact: true,
                  })}
                </motion.div>

                <p className="mt-6 text-sm text-[#6B7280]">
                  {isRegisterMode ? "Already have an account?" : "Don't have an account?"}{" "}
                  <Link
                    href={isRegisterMode ? "/login" : "/login?mode=register"}
                    className="font-semibold text-[#0D0D0D] hover:underline"
                  >
                    {isRegisterMode ? "Log in" : "Register"}
                  </Link>
                  {" or "}
                  <Link href={MARKETING_CTA.href} className="font-semibold text-[#0D0D0D] hover:underline">
                    {MARKETING_CTA.label}
                  </Link>
                </p>
              </>
            )}
          </motion.div>
        </motion.section>
      </motion.div>
    </div>
  );
}
