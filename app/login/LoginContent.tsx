"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Check } from "lucide-react";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
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
import { getFirebaseClientAuth, getFirebaseClientFirestore } from "@/app/lib/firebase/client";
import { getClientProfileData } from "@/app/lib/firestore/clientProfiles";

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
    accent: "text-emerald-400",
    check: true,
  },
  {
    title: "Launch Ready",
    value: "96% Average Readiness Score",
    accent: "text-[#00D4FF]",
    check: false,
  },
  {
    title: "Budget Risk",
    value: "-$14,800 Potential Waste Prevented",
    accent: "text-amber-300",
    check: false,
  },
  {
    title: "Issues Prevented",
    value: "127 Critical Issues Fixed",
    accent: "text-violet-300",
    check: false,
  },
];

const inputClassName =
  "h-[3.25rem] w-full rounded-xl border border-[#E8E6DF] bg-white/90 px-4 text-[15px] text-[#0D0D0D] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0D0D0D]/30 focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,13,13,0.06)]";

export default function LoginContent() {
  const router = useRouter();
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
  const queryStatusError = isPendingQuery
    ? LOGIN_PENDING_APPROVAL_ERROR
    : isDisabledQuery
      ? LOGIN_ACCOUNT_DISABLED_ERROR
      : null;
  const finalizingRef = useRef(false);
  const redirectedRef = useRef(false);

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

    const auth = getFirebaseClientAuth();
    const profileRef = doc(getFirebaseClientFirestore(), "userProfiles", resolvedUser.uid);
    const profile = await Promise.race([
      getClientProfileData<{ role?: string; status?: AccountStatus }>(resolvedUser.uid),
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
      if (shouldActivateProfile) {
        // Do not block dashboard redirect on profile write when the network is unstable.
        void Promise.race([
          setDoc(profileRef, {
            email: resolvedUser.email || "",
            username: resolvedUser.displayName || resolvedUser.email?.split("@")[0] || "",
            fullName: resolvedUser.displayName || "",
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
        authDebug("username_prompt_required", { uid: resolvedUser.uid });
        setPendingGoogleProfile({
          uid: resolvedUser.uid,
          email: resolvedUser.email,
          role: resolvedRole,
        });
        setGoogleUsername(
          resolvedUser.displayName?.trim() || resolvedUser.email?.split("@")[0] || "",
        );
        setGoogleUsernameError(null);
        setGoogleLoading(false);
        return;
      }

      setSuccess(true);
      redirectedRef.current = true;
      const destination = getPostAuthRedirect(resolvedRole);
      authDebug("redirecting", { destination, resolvedRole, accountStatus });
      router.replace(destination);

      // If the router transition is interrupted, enforce navigation shortly after.
      window.setTimeout(() => {
        if (window.location.pathname === "/login") {
          authDebug("router_fallback_assign", { destination });
          window.location.assign(destination);
        }
      }, 1200);
    } finally {
      authDebug("finalize_end");
      finalizingRef.current = false;
    }
  }

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    authDebug("persistence_init");
    void setPersistence(auth, browserLocalPersistence).catch(() => {
      // Keep default persistence if the browser blocks persistence APIs.
      authDebug("persistence_failed");
    });
  }, []);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
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
    let active = true;

    void (async () => {
      const auth = getFirebaseClientAuth();
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
      : "Sign in to Adigator";
  const leftSubtitle = isResetMode
    ? "We will send a secure link to your inbox."
    : isRegisterMode
      ? "Register to access your Adigator workspace."
      : "Continue to your campaign validation workspace.";
  const formTitle = isResetMode ? "Reset password" : isRegisterMode ? "Register" : "Log in";
  const submitLabel = isResetMode ? "Send reset link" : isRegisterMode ? "Register" : "Log in";


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
      await sendPasswordResetEmail(getFirebaseClientAuth(), trimmed);
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

    setLoading(true);
    setErrors({});
    setSignupSuccessMessage(null);

    try {
      const auth = getFirebaseClientAuth();
      const db = getFirebaseClientFirestore();

      if (isRegisterMode) {
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(credential.user, { displayName: trimmedUsername });

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
      setTimeout(() => router.replace(getPostAuthRedirect(resolvedRole)), 500);
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
    setGoogleLoading(true);

    try {
      const auth = getFirebaseClientAuth();
      await setPersistence(auth, browserLocalPersistence).catch(() => {
        // Continue with default persistence when browser restrictions apply.
      });
      const provider = new GoogleAuthProvider();
      const loginHint = email.trim();
      provider.setCustomParameters({
        prompt: "select_account",
        ...(loginHint ? { login_hint: loginHint } : {}),
      });
      authDebug("redirect_start");
      await signInWithRedirect(auth, provider);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed.";
      authDebug("google_signin_error", { message });
      setErrors({ form: message });
      setGoogleLoading(false);
    } finally {
      // Redirect flow leaves this page; keep the loading state if navigation succeeds.
    }
  };

  const handleGoogleUsernameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingGoogleProfile) return;

    const trimmedUsername = googleUsername.trim();
    if (!trimmedUsername || trimmedUsername.length < 2 || !DISPLAY_NAME_PATTERN.test(trimmedUsername)) {
      setGoogleUsernameError("Please enter a valid username.");
      return;
    }

    setGoogleUsernameError(null);
    setGoogleUsernameSaving(true);

    try {
      const auth = getFirebaseClientAuth();
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== pendingGoogleProfile.uid) {
        throw new Error("Your Google session changed. Please sign in again.");
      }

      await updateProfile(currentUser, { displayName: trimmedUsername });
      await setDoc(doc(getFirebaseClientFirestore(), "userProfiles", currentUser.uid), {
        email: currentUser.email || pendingGoogleProfile.email || "",
        username: trimmedUsername,
        fullName: trimmedUsername,
        role: pendingGoogleProfile.role,
        status: "active",
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setPendingGoogleProfile(null);
      setSuccess(true);
      redirectedRef.current = true;
      const destination = getPostAuthRedirect(pendingGoogleProfile.role);
      router.replace(destination);
      window.setTimeout(() => {
        if (window.location.pathname === "/login") {
          window.location.assign(destination);
        }
      }, 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save your username.";
      setGoogleUsernameError(message);
    } finally {
      setGoogleUsernameSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#0D0D0D]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left — brand panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#080808] px-10 py-12 text-white lg:flex xl:px-14 xl:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(200,168,107,0.12),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(255,255,255,0.04),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:64px_64px]" />

          <div className="relative z-10">
            <Link href="/" className="text-[1.35rem] font-black tracking-[-0.03em] text-white">
              Adigator
            </Link>
          </div>

          <div className="relative z-10 max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">{leftEyebrow}</p>
            <h1 className="mt-5 text-[clamp(2.25rem,4vw,3.25rem)] font-black leading-[1.02] tracking-[-0.04em] text-white">
              {leftTitle}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/55">{leftSubtitle}</p>

            <p className="mt-10 text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
              Launch With Confidence. Not Assumptions.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {VALIDATION_STATS.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition hover:border-white/[0.14] hover:bg-white/[0.06]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{stat.title}</p>
                  <p className={`mt-2 text-[15px] font-bold leading-snug ${stat.accent}`}>
                    {stat.check ? (
                      <span className="inline-flex items-start gap-1.5">
                        <Check size={16} className="mt-0.5 shrink-0" aria-hidden />
                        {stat.value}
                      </span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-sm text-white/45">
            {isRegisterMode ? "Already have an account?" : "New to Adigator?"}{" "}
            <Link
              href={isRegisterMode ? "/login" : "/login?mode=register"}
              className="font-semibold text-white/85 transition hover:text-white"
            >
              {isRegisterMode ? "Log in" : "Register"}
            </Link>
            {" or "}
            <Link href={MARKETING_CTA.href} className="inline-flex items-center gap-1 font-semibold text-white/85 transition hover:text-white">
              {MARKETING_CTA.label}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </p>
        </section>

        {/* Right — form panel */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 lg:hidden">
              <Link href="/" className="text-xl font-black tracking-tight text-[#0D0D0D]">
                Adigator
              </Link>
            </div>

            <h2 className="text-[clamp(2rem,5vw,2.75rem)] font-black tracking-[-0.04em] text-[#0D0D0D]">
              {pendingGoogleProfile ? "Choose a username" : formTitle}
            </h2>

            {pendingGoogleProfile ? (
              <form onSubmit={handleGoogleUsernameSubmit} noValidate className="mt-10 space-y-4">
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  Your Google account is connected. Choose the username that will appear across Adigator.
                </p>

                <input
                  id="google-username"
                  type="text"
                  autoComplete="username"
                  value={googleUsername}
                  onChange={(e) => setGoogleUsername(e.target.value)}
                  className={inputClassName}
                  placeholder="Username"
                />

                {googleUsernameError ? (
                  <p className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {googleUsernameError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={googleUsernameSaving}
                  className="mt-2 flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(13,13,13,0.18)] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {googleUsernameSaving ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                  {googleUsernameSaving ? "Saving…" : "Continue to dashboard"}
                </button>
              </form>
            ) : isResetMode ? (
              <form onSubmit={handlePasswordReset} noValidate className="mt-10 space-y-4">
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className={inputClassName}
                  placeholder="Email"
                />

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
                  className="mt-2 flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(13,13,13,0.18)] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60"
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
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={inputClassName}
                      placeholder="Username"
                    />
                  ) : null}

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                    placeholder="Email"
                  />

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isRegisterMode ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClassName} pr-16`}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280] transition hover:text-[#0D0D0D]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {isRegisterMode ? (
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClassName}
                      placeholder="Confirm password"
                    />
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
                    className="mt-2 flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(13,13,13,0.18)] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="mt-1 flex h-[3.25rem] w-full items-center justify-center gap-3 rounded-full border border-[#E8E6DF] bg-white text-[15px] font-semibold text-[#0D0D0D] transition hover:bg-[#F7F7F3] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#DAD8D2] bg-white text-sm font-bold">G</span>
                        {googleLoading ? "Connecting to Google…" : "Continue with Google"}
                      </button>
                    </>
                  ) : null}
                </form>

                <p className="mt-10 text-sm text-[#6B7280]">
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
          </div>
        </section>
      </div>
    </div>
  );
}
