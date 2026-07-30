"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Mail, Shield, User } from "lucide-react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseClientAuth, getFirebaseClientFirestore } from "../lib/firebase/client";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    const db = getFirebaseClientFirestore();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      void (async () => {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const profileSnap = await getDoc(doc(db, "userProfiles", firebaseUser.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : null;
        const resolvedUsername = profile?.username || firebaseUser.displayName || profile?.fullName || "";
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          user_metadata: {
            full_name: profile?.fullName || resolvedUsername,
          },
        });
        setUsername(resolvedUsername);
        setLoading(false);
      })();
    });

    return () => unsubscribe();
  }, []);

  const handleUsernameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Please enter a username.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const auth = getFirebaseClientAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You need to be signed in to update your username.");
      }

      await updateProfile(currentUser, { displayName: trimmedUsername });
      await setDoc(doc(getFirebaseClientFirestore(), "userProfiles", currentUser.uid), {
        email: currentUser.email || "",
        username: trimmedUsername,
        fullName: trimmedUsername,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setUser((current: any) => current ? {
        ...current,
        user_metadata: {
          ...(current.user_metadata || {}),
          full_name: trimmedUsername,
        },
      } : current);
      setMessage("Username saved.");
    } catch (submitError) {
      const submitMessage = submitError instanceof Error ? submitError.message : "Unable to save username.";
      setError(submitMessage);
    } finally {
      setSaving(false);
    }
  };

  const email = user?.email || "";
  const fullName = user?.user_metadata?.full_name || "";

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/50 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-white/40 mt-1">Manage your account and preferences</p>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <User size={18} />
            <h2 className="font-semibold">Profile</h2>
          </div>
          {loading ? (
            <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          ) : (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="text-xs uppercase tracking-wide text-white/40">Username</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-sky-400/60"
                  placeholder="Choose a username"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-white/40">Email</label>
                <p className="mt-1 text-white font-medium flex items-center gap-2">
                  <Mail size={14} className="text-white/40" />
                  {email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save username"}
                </button>
                {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
              </div>
            </form>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <Bell size={18} />
            <h2 className="font-semibold">Notifications</h2>
          </div>
          <p className="text-sm text-white/50">
            Email notifications for analysis completion and export readiness are coming soon.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <Shield size={18} />
            <h2 className="font-semibold">Security</h2>
          </div>
          <p className="text-sm text-white/50">
            Password and session management are handled through your login provider.
          </p>
          <Link
            href="/login"
            className="inline-flex text-sm font-semibold text-sky-400 hover:text-sky-300"
          >
            Sign in with a different account →
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
