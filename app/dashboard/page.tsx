"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalCreatives: 0, validCreatives: 0, invalidCreatives: 0, previewsRun: 0 });

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
    };
    load();
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/50 mt-1">Welcome back, {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}!</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Creatives" value={stats.totalCreatives} icon="🖼️" color="from-blue-600/20 to-blue-800/10" border="border-blue-500/20" />
        <StatCard label="Valid Creatives" value={stats.validCreatives} icon="✅" color="from-green-600/20 to-green-800/10" border="border-green-500/20" />
        <StatCard label="Invalid Creatives" value={stats.invalidCreatives} icon="❌" color="from-red-600/20 to-red-800/10" border="border-red-500/20" />
        <StatCard label="Previews Run" value={stats.previewsRun} icon="👁️" color="from-purple-600/20 to-purple-800/10" border="border-purple-500/20" />
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-white">Core Products</h2>
          <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-full">Featured</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/preview" className="group relative rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-600/20 to-blue-600/10 p-6 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 block">
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">CORE</div>
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-white mb-2">Creative Preview</h3>
            <p className="text-white/50 text-sm mb-6">Upload, validate and preview your ad creatives across News, Gaming and Ecommerce templates.</p>
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
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, border }: any) {
  return (
    <div className={`rounded-2xl border ${border} bg-gradient-to-br ${color} p-5 hover:scale-[1.02] transition duration-200`}>
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-sm text-white/40 mt-1">{label}</p>
    </div>
  );
}