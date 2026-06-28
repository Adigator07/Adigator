"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";
import { supabase } from "@/app/lib/supabase";
import {
  GENERIC_AUTH_VALIDATION_ERROR,
  GENERIC_SIGNUP_RESPONSE_MESSAGE,
  LOGIN_INCORRECT_CREDENTIALS_ERROR,
  LOGIN_SERVER_ERROR,
  LOGIN_SERVICE_UNAVAILABLE_ERROR,
  PASSWORD_RESET_REQUEST_MESSAGE,
} from "@/app/lib/auth/constants";
import { logUserActivity } from "@/app/lib/userActivity";
import { REGISTRATION_ROLES, getPostAuthRedirect } from "@/app/lib/communications/roleLabels";
import type { UserRole } from "@/app/lib/communications/types";

type RegisterRole = Extract<UserRole, "usa_client" | "end_client">;

type FieldErrors = {
  form?: string;
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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
      <path d="M21.35 12.25c0-.78-.07-1.52-.2-2.24H12v4.24h5.23c-.22 1.2-.9 2.22-1.9 2.9v2.41h3.08c1.81-1.67 2.94-4.12 2.94-7.31Z" fill="#4285F4" />
      <path d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.08-2.41c-.87.58-1.98.93-3.37.93-2.58 0-4.77-1.74-5.56-4.08H3.26v2.49A9.74 9.74 0 0 0 12 21.75Z" fill="#34A853" />
      <path d="M6.44 13.83a5.86 5.86 0 0 1 0-3.66V7.68H3.26a9.74 9.74 0 0 0 0 8.64l3.18-2.49Z" fill="#FBBC05" />
      <path d="M12 6.09c1.4 0 2.65.48 3.64 1.43l2.73-2.73C16.84 3.38 14.63 2.5 12 2.5 8.2 2.5 4.93 4.68 3.26 7.68l3.18 2.49C7.23 7.83 9.42 6.09 12 6.09Z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisterMode = searchParams.get("mode") === "register";
  const isResetMode = searchParams.get("reset") === "1";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("usa_client");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      setResetMessage(result.message || PASSWORD_RESET_REQUEST_MESSAGE);
    } catch {
      setResetMessage(PASSWORD_RESET_REQUEST_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};

    if (isRegisterMode) {
      if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !selectedRole) {
        nextErrors.form = GENERIC_AUTH_VALIDATION_ERROR;
      } else if (password.trim() !== confirmPassword.trim()) {
        nextErrors.form = GENERIC_AUTH_VALIDATION_ERROR;
      }
    } else if (!email.trim() || !password.trim()) {
      nextErrors.form = LOGIN_INCORRECT_CREDENTIALS_ERROR;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const endpoint = isRegisterMode ? "/api/auth/signup" : "/api/auth/login";
      const payload = isRegisterMode
        ? {
            email: email.trim(),
            password,
            confirmPassword,
            username: username.trim(),
            displayName: username.trim(),
            role: selectedRole,
          }
        : { email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        let message: string;
        if (isRegisterMode) {
          message = response.status === 400
            ? (result.error || GENERIC_AUTH_VALIDATION_ERROR)
            : GENERIC_SIGNUP_RESPONSE_MESSAGE;
        } else if (response.status === 401) {
          message = LOGIN_INCORRECT_CREDENTIALS_ERROR;
        } else if (response.status === 404 || response.status === 405) {
          message = LOGIN_SERVICE_UNAVAILABLE_ERROR;
        } else if (response.status >= 500) {
          message = LOGIN_SERVER_ERROR;
        } else {
          message = result.error || LOGIN_INCORRECT_CREDENTIALS_ERROR;
        }
        setErrors({ form: message });
        return;
      }

      if (isRegisterMode && (result.requiresEmailConfirmation || !result.session)) {
        setErrors({ form: result.message || GENERIC_SIGNUP_RESPONSE_MESSAGE });
        return;
      }

      if (!result.session?.access_token || !result.session?.refresh_token) {
        setErrors({ form: isRegisterMode ? (result.message || GENERIC_SIGNUP_RESPONSE_MESSAGE) : LOGIN_INCORRECT_CREDENTIALS_ERROR });
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
      if (sessionError) throw sessionError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrors({ form: LOGIN_INCORRECT_CREDENTIALS_ERROR });
        return;
      }

      const metaRole = user.user_metadata?.role as RegisterRole | undefined;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const resolvedRole = (profile?.role || metaRole || selectedRole || "end_client") as RegisterRole;

      if (isRegisterMode) {
        await logUserActivity("user_registered", {
          event_label: "User registered and signed in",
          metadata: { email: user.email || email.trim(), role: resolvedRole },
        });
      } else {
        await logUserActivity("user_login", {
          event_label: "User logged in",
          metadata: { email: user.email || email.trim(), role: resolvedRole },
        });
      }

      setSuccess(true);
      setTimeout(() => router.replace(getPostAuthRedirect(resolvedRole)), 500);
    } catch {
      setErrors({
        form: isRegisterMode
          ? GENERIC_SIGNUP_RESPONSE_MESSAGE
          : LOGIN_SERVICE_UNAVAILABLE_ERROR,
      });
    } finally {
      setLoading(false);
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
              Book a demo
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
              {formTitle}
            </h2>

            {isResetMode ? (
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

                {errors.form ? (
                  <p className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">{errors.form}</p>
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
                <button
                  type="button"
                  className="mt-10 flex h-[3.25rem] w-full items-center justify-center gap-3 rounded-xl border border-[#E8E6DF] bg-white text-[15px] font-medium text-[#0D0D0D] shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition hover:border-[#D5D2C8] hover:bg-[#FDFCFA]"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="my-8 flex items-center gap-4">
                  <span className="h-px flex-1 bg-[#E8E6DF]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
                    or continue with email
                  </span>
                  <span className="h-px flex-1 bg-[#E8E6DF]" />
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

                  {errors.form ? (
                    <p className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">{errors.form}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || success}
                    className="mt-2 flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(13,13,13,0.18)] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {success ? <Check size={18} aria-hidden /> : loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                    {success ? "Success" : loading ? "Please wait…" : submitLabel}
                  </button>
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
                    Get a demo
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
