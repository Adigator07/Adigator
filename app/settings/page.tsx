"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Mail, Shield, User } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

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
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-white/40">Name</label>
                <p className="mt-1 text-white font-medium">{fullName || "Not set"}</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-white/40">Email</label>
                <p className="mt-1 text-white font-medium flex items-center gap-2">
                  <Mail size={14} className="text-white/40" />
                  {email}
                </p>
              </div>
            </div>
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
