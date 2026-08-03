"use client";

import { BarChart3 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #bae6fd",
  color: "#0f172a",
  borderRadius: "0.8rem",
};

export default function UserAnalyticsChartsInner({ analytics }) {
  const analysisData = analytics.analysisByDay?.length
    ? analytics.analysisByDay
    : [{ date: new Date().toISOString().slice(0, 10), count: 0 }];

  const platformData = analytics.platformUsage || [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-sky-200/80 bg-linear-to-br from-white via-sky-50/70 to-emerald-50/70 p-4 shadow-[0_16px_34px_-24px_rgba(14,116,144,0.34)]">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-2 text-sky-700">
            <BarChart3 size={16} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Creatives Analyzed (14 days)</h3>
        </div>
        <div style={{ width: "100%", height: 200, minHeight: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysisData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-200/80 bg-linear-to-br from-white via-sky-50/70 to-emerald-50/70 p-4 shadow-[0_16px_34px_-24px_rgba(14,116,144,0.34)]">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2 text-emerald-700">
            <BarChart3 size={16} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Platform Activity</h3>
        </div>
        <div style={{ width: "100%", height: 200, minHeight: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis type="category" dataKey="platform" width={100} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
