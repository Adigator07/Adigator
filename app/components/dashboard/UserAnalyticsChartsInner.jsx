"use client";

import { BarChart3 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
const tooltipStyle = { background: "#0f172a", border: "1px solid #ffffff20" };

export default function UserAnalyticsChartsInner({ analytics }) {
  const analysisData = analytics.analysisByDay?.length
    ? analytics.analysisByDay
    : [{ date: new Date().toISOString().slice(0, 10), count: 0 }];

  const platformData = analytics.platformUsage || [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-sky-400" />
          <h3 className="text-sm font-semibold text-white">Creatives Analyzed (14 days)</h3>
        </div>
        <div style={{ width: "100%", height: 200, minHeight: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysisData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fill: "#ffffff50", fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#ffffff50", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Platform Activity</h3>
        </div>
        <div style={{ width: "100%", height: 200, minHeight: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#ffffff50", fontSize: 10 }} />
              <YAxis type="category" dataKey="platform" width={100} tick={{ fill: "#ffffff50", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
