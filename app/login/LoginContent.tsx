"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Loader2, Check } from "lucide-react";
import ParticleCanvas from "@/app/components/ParticleCanvas";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";
import { supabase } from "@/app/lib/supabase";
import { logUserActivity } from "@/app/lib/userActivity";
import { REGISTRATION_ROLES, getPostAuthRedirect } from "@/app/lib/communications/roleLabels";
import type { UserRole } from "@/app/lib/communications/types";

type RegisterRole = Extract<UserRole, "usa_client" | "end_client">;

type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  form?: string;
};

const TICKERS = [
  { label: "Impressions", value: "2.4M", delta: "+12%" },
  { label: "CTR", value: "3.8%", delta: "+0.4%" },
  { label: "Conversions", value: "18.2K", delta: "+9%" },
  { label: "RoAS", value: "4.2x", delta: "+0.6" },
];

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const isRegisterMode = searchParams.get("mode") === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("usa_client");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeField, setShakeField] = useState<string | null>(null);

  const triggerShake = (field: string) => {
    setShakeField(field);
    setTimeout(() => setShakeField(null), 400);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};

    if (isRegisterMode && !username.trim()) nextErrors.username = "Username is required.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password.trim()) nextErrors.password = "Password is required.";
    if (isRegisterMode) {
      if (!confirmPassword.trim()) nextErrors.confirmPassword = "Please confirm your password.";
      else if (password.trim() !== confirmPassword.trim()) nextErrors.confirmPassword = "Passwords do not match.";
      if (!selectedRole) nextErrors.role = "Please select your role.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const first = Object.keys(nextErrors)[0];
      triggerShake(first);
      return;
    }

    setLoading(true);
    setErrors({});

    const syncProfileRole = async (userId: string, userEmail: string, fullName: string, role: RegisterRole) => {
      await supabase.from("profiles").upsert({
        id: userId,
        email: userEmail,
        full_name: fullName,
        role,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    };

    try {
      if (isRegisterMode) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: { full_name: username.trim(), username: username.trim(), role: selectedRole },
          },
        });
        if (error) throw error;
        if (data.user) await syncProfileRole(data.user.id, email.trim(), username.trim(), selectedRole);
        if (data.session) {
          await logUserActivity("user_registered", { event_label: "User registered and signed in", metadata: { email: email.trim(), role: selectedRole } });
          setSuccess(true);
          setTimeout(() => router.replace(getPostAuthRedirect(selectedRole)), 500);
          return;
        }
        setErrors({ form: "Registration successful. Check your email to confirm your account, then log in." });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
      if (error) throw error;

      if (data.session?.user) {
        const metaRole = data.session.user.user_metadata?.role as RegisterRole | undefined;
        if (metaRole) {
          await syncProfileRole(data.session.user.id, data.session.user.email || email.trim(), data.session.user.user_metadata?.full_name || username.trim(), metaRole);
        }
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).maybeSingle();
        await logUserActivity("user_login", { event_label: "User logged in", metadata: { email: email.trim(), role: profile?.role || metaRole } });
        setSuccess(true);
        setTimeout(() => router.replace(getPostAuthRedirect(profile?.role || metaRole || "end_client")), 500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setErrors({ form: message });
      triggerShake("form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--agi-bg)] text-[var(--agi-text-primary)]">
      {success ? (
        <div className="pointer-events-none fixed inset-0 z-[90] bg-[rgba(59,123,255,0.25)] animate-pulse" aria-hidden="true" />
      ) : null}

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[3fr_2fr]">
        {/* Left panel */}
        <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden p-10 lg:flex">
          <div className="absolute inset-0">
            <div className="agi-particle-fallback h-full w-full" />
            <div className="absolute inset-0">
              <ParticleCanvas density="dense" interactive={false} fullScreen={false} />
            </div>
          </div>
          <div className="relative z-10">
            <Link href="/" className="text-xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-[#3B7BFF] to-[#00D4FF] bg-clip-text text-transparent">Adigator</span>
            </Link>
          </div>
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.2em] text-[#00d4ff]">Ad Intelligence Platform</p>
            <h1 className="agi-hero-glow mt-4 max-w-lg text-4xl font-extrabold leading-tight tracking-[-0.03em] text-[#f0f2ff] xl:text-5xl">
              Where Ad Intelligence Meets Action
            </h1>
            <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
              {TICKERS.map((t, i) => (
                <motion.div
                  key={t.label}
                  className="rounded-xl border border-[rgba(59,123,255,0.25)] bg-[rgba(14,16,22,0.92)] p-4 backdrop-blur-md"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <p className="agi-stat-value text-xl text-[#f0f2ff]">{t.value}</p>
                  <p className="mt-1 text-xs text-[#8890a8]">{t.label}</p>
                  <p className="mt-1 text-xs font-medium text-[#00ff88]">{t.delta}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-sm text-[#8890a8]">
            Signal-rich validation · Contextual previews · Strategic export
          </p>
        </section>

        {/* Right panel — form */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12">
          <motion.div
            className="w-full max-w-md rounded-2xl border border-[rgba(59,123,255,0.3)] bg-[#111318] p-8 shadow-2xl"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8 text-center">
              <Link href="/" className="text-lg font-extrabold lg:hidden">
                <span className="bg-gradient-to-r from-[#3B7BFF] to-[#00D4FF] bg-clip-text text-transparent">Adigator</span>
              </Link>
              <h2 className="mt-2 text-2xl font-bold text-[#f0f2ff]">{isRegisterMode ? "Create account" : "Welcome back"}</h2>
              <p className="mt-1 text-sm text-[#8890a8]">
                {isRegisterMode ? "Register to access your workspace" : "Sign in to continue"}
              </p>
            </div>

            <button
              type="button"
              className="agi-btn-ghost w-full !h-12 !text-sm"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path d="M21.35 12.25c0-.78-.07-1.52-.2-2.24H12v4.24h5.23c-.22 1.2-.9 2.22-1.9 2.9v2.41h3.08c1.81-1.67 2.94-4.12 2.94-7.31Z" fill="#4285F4" />
                <path d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.08-2.41c-.87.58-1.98.93-3.37.93-2.58 0-4.77-1.74-5.56-4.08H3.26v2.49A9.74 9.74 0 0 0 12 21.75Z" fill="#34A853" />
                <path d="M6.44 13.83a5.86 5.86 0 0 1 0-3.66V7.68H3.26a9.74 9.74 0 0 0 0 8.64l3.18-2.49Z" fill="#FBBC05" />
                <path d="M12 6.09c1.4 0 2.65.48 3.64 1.43l2.73-2.73C16.84 3.38 14.63 2.5 12 2.5 8.2 2.5 4.93 4.68 3.26 7.68l3.18 2.49C7.23 7.83 9.42 6.09 12 6.09Z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--agi-border-subtle)]" />
              <span className="text-xs uppercase tracking-wider text-[var(--agi-text-muted)]">or continue with email</span>
              <span className="h-px flex-1 bg-[var(--agi-border-subtle)]" />
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {isRegisterMode ? (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--agi-text-muted)]">I am a…</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {REGISTRATION_ROLES.map((option) => {
                      const active = selectedRole === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedRole(option.value as RegisterRole);
                            if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                          }}
                          className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                            active
                              ? "border-[var(--agi-accent-blue)] bg-[rgba(59,123,255,0.15)]"
                              : "border-[var(--agi-border-subtle)] hover:border-[var(--agi-border-active)]"
                          }`}
                        >
                          <p className="font-semibold">{option.label}</p>
                          <p className="mt-0.5 text-xs text-[var(--agi-text-secondary)]">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  {errors.role ? <p className="mt-2 text-xs text-red-400">{errors.role}</p> : null}
                </div>
              ) : null}

              {isRegisterMode ? (
                <div className={`agi-floating-field ${shakeField === "username" ? "agi-shake" : ""}`}>
                  <input
                    id="username"
                    type="text"
                    placeholder=" "
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors((p) => ({ ...p, username: undefined })); }}
                    className={`agi-input ${errors.username ? "agi-input-error" : ""}`}
                  />
                  <label htmlFor="username" className="agi-floating-label">Username</label>
                  {errors.username ? <p className="mt-1 text-xs text-red-400">{errors.username}</p> : null}
                </div>
              ) : null}

              <div className={`agi-floating-field agi-floating-field--has-icon ${shakeField === "email" ? "agi-shake" : ""}`}>
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                  className={`agi-input ${errors.email ? "agi-input-error" : ""}`}
                />
                <label htmlFor="email" className="agi-floating-label">Email</label>
                <Mail size={16} className="agi-field-icon" />
                {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email}</p> : null}
              </div>

              <div className={`agi-floating-field agi-floating-field--has-icon ${shakeField === "password" ? "agi-shake" : ""}`}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                  className={`agi-input pr-12 ${errors.password ? "agi-input-error" : ""}`}
                />
                <label htmlFor="password" className="agi-floating-label">Password</label>
                <Lock size={16} className="agi-field-icon" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-[28px] rounded p-1 text-[var(--agi-text-muted)] hover:text-[var(--agi-text-primary)]" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password ? <p className="mt-1 text-xs text-red-400">{errors.password}</p> : null}
              </div>

              {isRegisterMode ? (
                <div className={`agi-floating-field ${shakeField === "confirmPassword" ? "agi-shake" : ""}`}>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                    className={`agi-input ${errors.confirmPassword ? "agi-input-error" : ""}`}
                  />
                  <label htmlFor="confirm-password" className="agi-floating-label">Confirm password</label>
                  {errors.confirmPassword ? <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p> : null}
                </div>
              ) : null}

              {!isRegisterMode ? (
                <div className="flex justify-end">
                  <Link href="/login?reset=1" className="text-xs text-[var(--agi-text-muted)] hover:text-[var(--agi-accent-cyan)]">Forgot password?</Link>
                </div>
              ) : null}

              {errors.form ? (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{errors.form}</p>
              ) : null}

              <button type="submit" disabled={loading || success} className="agi-btn-primary w-full">
                {success ? <Check size={20} /> : loading ? <Loader2 size={20} className="animate-spin" /> : null}
                <span>{success ? "Success" : loading ? "Please wait…" : isRegisterMode ? "Register" : "Log in"}</span>
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--agi-text-muted)]">
              {isRegisterMode ? "Already have an account?" : "New here?"}{" "}
              <Link href={isRegisterMode ? "/login" : "/login?mode=register"} className="font-semibold text-[var(--agi-accent-cyan)] hover:underline">
                {isRegisterMode ? "Log in" : "Register"}
              </Link>
              {" · "}
              <Link href={MARKETING_CTA.href} className="font-semibold text-[var(--agi-accent-cyan)] hover:underline">Get a demo</Link>
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
