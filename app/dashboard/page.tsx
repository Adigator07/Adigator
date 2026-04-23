"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";
import { SkeletonStatCard, SkeletonProjectCard } from "../components/SkeletonLoader";
import {
  Zap, TrendingUp, Eye, ImageIcon, Plus, ArrowRight, Clock,
  ShoppingCart, Newspaper, Gamepad2, Coffee, Laptop, GraduationCap, Film, Sparkles
} from "lucide-react";

const TEMPLATE_CATEGORIES = [
  { id: "ecommerce",     label: "Ecommerce",     icon: ShoppingCart, color: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/20", text: "text-orange-400" },
  { id: "newspaper",    label: "News",           icon: Newspaper,    color: "from-blue-500/20 to-blue-600/10",   border: "border-blue-500/20",   text: "text-blue-400" },
  { id: "gaming",       label: "Gaming",         icon: Gamepad2,     color: "from-green-500/20 to-green-600/10", border: "border-green-500/20",  text: "text-green-400" },
  { id: "food",         label: "Food",           icon: Coffee,       color: "from-yellow-500/20 to-yellow-600/10",border: "border-yellow-500/20",text: "text-yellow-400" },
  { id: "technology",   label: "Technology",     icon: Laptop,       color: "from-cyan-500/20 to-cyan-600/10",   border: "border-cyan-500/20",   text: "text-cyan-400" },
  { id: "education",    label: "Education",      icon: GraduationCap,color: "from-purple-500/20 to-purple-600/10",border: "border-purple-500/20",text: "text-purple-400" },
  { id: "entertainment",label: "Entertainment",  icon: Film,         color: "from-pink-500/20 to-pink-600/10",   border: "border-pink-500/20",   text: "text-pink-400" },
];

const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalCreatives: 0, validCreatives: 0, invalidCreatives: 0, previewsRun: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: creatives } = await supabase.from("creatives").select("*").eq("user_id", user.id);
        if (creatives) {
          setStats({
            totalCreatives: creatives.length,
            validCreatives: creatives.filter((c: any) => c.valid).length,
            invalidCreatives: creatives.filter((c: any) => !c.valid).length,
            previewsRun: creatives.filter((c: any) => c.previewed).length,
          });
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-10 pb-10">

      {/* ── Welcome ─────────────────────────────────────────── */}
      <motion.div variants={fade} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Sparkles size={15} />
            <span className="text-xs font-bold tracking-widest uppercase">{today}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Good day, {firstName} 👋
          </h1>
          <p className="text-white/40 mt-1 text-sm">Create stunning creatives in seconds</p>
        </div>
        <Link href="/preview">
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
          >
            <Plus size={18} /> New Creative
          </motion.button>
        </Link>
      </motion.div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <motion.div variants={fade}>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/preview", icon: Plus, label: "Create New Template", sub: "Start fresh", color: "from-purple-600 to-blue-600" },
            { href: "/preview", icon: Clock, label: "Resume Last Project", sub: "Continue where you left off", color: "from-blue-600 to-cyan-600" },
            { href: "/intelligence", icon: Eye,  label: "Ad Intelligence", sub: "Analyze & optimize", color: "from-fuchsia-600 to-pink-600" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href + a.label} href={a.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-4 hover:border-white/20 hover:bg-white/8 transition-all cursor-pointer overflow-hidden"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{a.label}</p>
                    <p className="text-xs text-white/40">{a.sub}</p>
                  </div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-white/60 transition shrink-0" />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <motion.div variants={fade}>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Overview</h2>
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total Creatives", value: stats.totalCreatives, Icon: ImageIcon, color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20", text: "text-blue-400" },
              { label: "Valid Creatives",  value: stats.validCreatives,  Icon: TrendingUp, color: "from-green-500/20 to-green-600/10", border: "border-green-500/20", text: "text-green-400" },
              { label: "Invalid",          value: stats.invalidCreatives,Icon: Zap,        color: "from-red-500/20 to-red-600/10",   border: "border-red-500/20",   text: "text-red-400" },
              { label: "Previews Run",     value: stats.previewsRun,     Icon: Eye,        color: "from-purple-500/20 to-purple-600/10",border: "border-purple-500/20",text: "text-purple-400" },
            ].map((s) => (
              <motion.div
                key={s.label}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.color} p-5 transition-all`}
              >
                <s.Icon size={20} className={`${s.text} mb-3`} />
                <p className="text-3xl font-extrabold text-white">{s.value.toLocaleString()}</p>
                <p className="text-sm text-white/40 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Core Products ───────────────────────────────────── */}
      <motion.div variants={fade}>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Core Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/preview" className="group relative rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-600/20 to-blue-600/10 p-6 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 block">
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">CORE</div>
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-white mb-2">Creative Preview</h3>
            <p className="text-white/50 text-sm mb-6">Upload, validate and preview your ad creatives across 9 templates with slide-based export.</p>
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm group-hover:gap-4 transition-all">Launch Preview →</div>
          </Link>
          <Link href="/intelligence" className="group relative rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-600/20 to-cyan-600/10 p-6 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 block">
            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">CORE</div>
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-white mb-2">Ad Intelligence</h3>
            <p className="text-white/50 text-sm mb-6">Analyze ad performance, get AI-powered insights and optimize your programmatic campaigns.</p>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm group-hover:gap-4 transition-all">Launch Intelligence →</div>
          </Link>
        </div>
      </motion.div>

      {/* ── Recent Projects ─────────────────────────────────── */}
      <motion.div variants={fade}>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Recent Projects</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <SkeletonProjectCard key={i} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-white font-semibold mb-1">No projects yet</p>
            <p className="text-white/40 text-sm mb-4">Start a new creative preview to see your projects here.</p>
            <Link href="/preview">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-sm">
                Create First Project
              </motion.button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── Template Categories ──────────────────────────────── */}
      <motion.div variants={fade}>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Template Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} href={`/preview`}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className={`group rounded-2xl border ${cat.border} bg-gradient-to-br ${cat.color} p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:shadow-lg`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition`}>
                    <Icon size={20} className={cat.text} />
                  </div>
                  <span className="text-xs font-semibold text-white/70 group-hover:text-white transition text-center">{cat.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}