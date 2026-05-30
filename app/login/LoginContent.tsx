"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
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

const VALUE_CARDS = [
  { label: "RoAS", value: "↑ 69%" },
  { label: "CPI", value: "↓ 41%" },
  { label: "Launch Speed", value: "3.1x" },
  { label: "Waste", value: "-27%" },
];

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisterMode = searchParams.get("mode") === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("usa_client");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {};

    if (isRegisterMode && !username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }

    if (isRegisterMode) {
      if (!confirmPassword.trim()) {
        nextErrors.confirmPassword = "Please confirm your password.";
      } else if (password.trim() !== confirmPassword.trim()) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
      if (!selectedRole) {
        nextErrors.role = "Please select your role.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
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
            data: {
              full_name: username.trim(),
              username: username.trim(),
              role: selectedRole,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          await syncProfileRole(data.user.id, email.trim(), username.trim(), selectedRole);
        }

        if (data.session) {
          await logUserActivity("user_registered", {
            event_label: "User registered and signed in",
            metadata: { email: email.trim(), role: selectedRole },
          });
          router.replace(getPostAuthRedirect(selectedRole));
          return;
        }

        setErrors({
          form: "Registration successful. Check your email to confirm your account, then log in.",
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data.session?.user) {
        const metaRole = data.session.user.user_metadata?.role as RegisterRole | undefined;
        if (metaRole) {
          await syncProfileRole(
            data.session.user.id,
            data.session.user.email || email.trim(),
            data.session.user.user_metadata?.full_name || username.trim(),
            metaRole,
          );
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .maybeSingle();

        await logUserActivity("user_login", {
          event_label: "User logged in",
          metadata: { email: email.trim(), role: profile?.role || metaRole },
        });
        router.replace(getPostAuthRedirect(profile?.role || metaRole || "end_client"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative flex min-h-[42vh] flex-col overflow-hidden bg-[#0D0D0D] px-7 py-8 text-white sm:px-10 lg:min-h-screen lg:px-12 lg:py-10">
          <div className="flex items-start justify-between">
            <Link href="/" className="text-3xl font-black tracking-tight text-white">
              Adigator
            </Link>
          </div>

          <div className="my-auto">
            <p className="text-sm uppercase tracking-[0.18em] text-white/60">
              {isRegisterMode ? "Create Account" : "Welcome Back"}
            </p>
            <h1 className="mt-5 text-[clamp(2.2rem,6vw,4.8rem)] font-black leading-[0.96] tracking-[-0.03em] text-white">
              {isRegisterMode ? "Create your account." : "Welcome back."}
            </h1>
            <p className="mt-4 max-w-md text-base text-white/70">
              {isRegisterMode ? "Register to access your Adigator workspace." : "Log in to your dashboard."}
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
              {VALUE_CARDS.map((card, index) => (
                <motion.article
                  key={card.label}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                >
                  <motion.p
                    className="text-2xl font-black tracking-tight text-white"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3.2 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {card.value}
                  </motion.p>
                  <p className="mt-1 text-xs uppercase tracking-[0.13em] text-white/60">{card.label}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <p className="mt-10 text-sm text-white/70">
            {isRegisterMode ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link href={isRegisterMode ? "/login" : "/login?mode=register"} className="font-semibold text-white underline underline-offset-4">
              {isRegisterMode ? "Log in" : "Register"}
            </Link>
            {"  "}
            or{" "}
            <Link href={MARKETING_CTA.href} className="font-semibold text-white underline underline-offset-4">
              Book a demo →
            </Link>
          </p>
        </section>

        <section className="flex min-h-[58vh] items-center justify-center px-6 py-10 sm:px-10 lg:min-h-screen lg:px-14">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-black tracking-tight text-[#0D0D0D]">{isRegisterMode ? "Register" : "Log in"}</h2>

            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-[#D0D0C8] bg-white px-5 py-3.5 text-sm font-semibold text-[#1B1B1B] transition hover:bg-[#FAFAF8]"
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
              <span className="h-px flex-1 bg-[#DAD9D0]" />
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#75756D]">or continue with email</span>
              <span className="h-px flex-1 bg-[#DAD9D0]" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {isRegisterMode && (
                <div className="mb-5">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#75756D] mb-3">
                    I am a...
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                          className={`rounded-xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-[#0D0D0D] bg-[#0D0D0D] text-white shadow-md"
                              : "border-[#D0D0C8] bg-white text-[#0D0D0D] hover:border-[#0D0D0D]/40"
                          }`}
                        >
                          <p className="text-sm font-bold">{option.label}</p>
                          <p className={`mt-1 text-xs leading-relaxed ${active ? "text-white/70" : "text-[#66665F]"}`}>
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {errors.role ? <p className="mt-2 text-xs text-red-600">{errors.role}</p> : null}
                </div>
              )}

              {isRegisterMode && (
                <div className="relative mb-4">
                  <input
                    id="username"
                    type="text"
                    placeholder=" "
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                    }}
                    className={`peer w-full rounded-lg border bg-transparent px-4 pb-2 pt-6 text-sm text-[#0D0D0D] outline-none transition ${
                      errors.username
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-[#D0D0C8] focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#E0E3D5]"
                    }`}
                  />
                  <label htmlFor="username" className="pointer-events-none absolute left-4 top-2 text-xs font-medium uppercase tracking-[0.12em] text-[#75756D]">
                    Username
                  </label>
                  {errors.username ? <p className="mt-2 text-xs text-red-600">{errors.username}</p> : null}
                </div>
              )}

              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`peer w-full rounded-lg border bg-transparent px-4 pb-2 pt-6 text-sm text-[#0D0D0D] outline-none transition ${
                    errors.email
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-[#D0D0C8] focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#E0E3D5]"
                  }`}
                />
                <label htmlFor="email" className="pointer-events-none absolute left-4 top-2 text-xs font-medium uppercase tracking-[0.12em] text-[#75756D]">
                  Email
                </label>
                {errors.email ? <p className="mt-2 text-xs text-red-600">{errors.email}</p> : null}
              </div>

              <div className="relative mt-4">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`peer w-full rounded-lg border bg-transparent px-4 pb-2 pt-6 text-sm text-[#0D0D0D] outline-none transition ${
                    errors.password
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-[#D0D0C8] focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#E0E3D5]"
                  }`}
                />
                <label htmlFor="password" className="pointer-events-none absolute left-4 top-2 text-xs font-medium uppercase tracking-[0.12em] text-[#75756D]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-[#5E5E58] hover:text-[#171717]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
                {errors.password ? <p className="mt-2 text-xs text-red-600">{errors.password}</p> : null}
              </div>

              {isRegisterMode ? (
                <div className="relative mt-4">
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className={`peer w-full rounded-lg border bg-transparent px-4 pb-2 pt-6 text-sm text-[#0D0D0D] outline-none transition ${
                      errors.confirmPassword
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-[#D0D0C8] focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#E0E3D5]"
                    }`}
                  />
                  <label htmlFor="confirm-password" className="pointer-events-none absolute left-4 top-2 text-xs font-medium uppercase tracking-[0.12em] text-[#75756D]">
                    Confirm password
                  </label>
                  {errors.confirmPassword ? <p className="mt-2 text-xs text-red-600">{errors.confirmPassword}</p> : null}
                </div>
              ) : null}

              {!isRegisterMode ? (
                <div className="mt-3 flex justify-end">
                  <Link href="/login?reset=1" className="text-xs font-medium text-[#77776E] hover:text-[#171717]">
                    Forgot password?
                  </Link>
                </div>
              ) : null}

              {errors.form ? (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {errors.form}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="marketing-btn-dark mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Please wait..." : isRegisterMode ? "Register" : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#66665F]">
              {isRegisterMode ? "Already have an account?" : "New here?"}{" "}
              <Link href={isRegisterMode ? "/login" : "/login?mode=register"} className="font-semibold text-[#111] underline underline-offset-4">
                {isRegisterMode ? "Log in" : "Register"}
              </Link>
              {"  "}
              or{" "}
              <Link href={MARKETING_CTA.href} className="font-semibold text-[#111] underline underline-offset-4">
                Get a demo
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
