"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ChartContainer } from "@/app/components/admin/ChartContainer";
import type { DashboardMetrics } from "@/app/lib/admin-platform/types";

const PIE_COLORS = ["#f59e0b", "#10b981", "#38bdf8", "#a78bfa", "#f472b6", "#fb7185"];

const tooltipStyle = { background: "#0f172a", border: "1px solid #ffffff20" };

export function DashboardCharts({ metrics }: { metrics: DashboardMetrics }) {
  const deviceData = useMemo(
    () => Object.entries(metrics.deviceBreakdown).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
    [metrics.deviceBreakdown],
  );

  const browserData = useMemo(
    () => Object.entries(metrics.browserBreakdown).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
    [metrics.browserBreakdown],
  );

  const countryData = useMemo(
    () => Object.entries(metrics.countryBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value })),
    [metrics.countryBreakdown],
  );

  const featureData = useMemo(() => metrics.topFeatures.slice(0, 6), [metrics.topFeatures]);
  const pageData = useMemo(() => metrics.topPages.slice(0, 6), [metrics.topPages]);
  const growthData = useMemo(() => metrics.userGrowth, [metrics.userGrowth]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer height={256}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="date" tick={{ fill: "#ffffff60", fontSize: 10 }} />
                <YAxis tick={{ fill: "#ffffff60", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Device Distribution</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer height={256}>
            {deviceData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-white/40">No device data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Browser Analytics</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer height={256}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={browserData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="name" tick={{ fill: "#ffffff60", fontSize: 10 }} />
                <YAxis tick={{ fill: "#ffffff60", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top Features</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer height={256}>
            {featureData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-white/40">No feature usage yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                  <XAxis type="number" tick={{ fill: "#ffffff60", fontSize: 10 }} />
                  <YAxis type="category" dataKey="feature" width={100} tick={{ fill: "#ffffff60", fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>Country Distribution & Top Pages</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ChartContainer height={224}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="name" tick={{ fill: "#ffffff60", fontSize: 9 }} />
                <YAxis tick={{ fill: "#ffffff60", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Most active pages</p>
            {pageData.length === 0 ? (
              <p className="text-sm text-white/40">No page activity recorded yet.</p>
            ) : (
              pageData.map((p) => (
                <div key={p.page} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-sm text-white/80">{p.page}</span>
                  <span className="text-sm font-bold text-amber-300">{p.count}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
