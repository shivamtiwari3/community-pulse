"use client";

import { Parcel } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MapPin, Layers, TrendingUp, Zap } from "lucide-react";

interface Props {
  parcels: Parcel[];
}

const CHART_TOOLTIP = {
  contentStyle: { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "11px", color: "#e5e7eb" },
};

const STATUS_COLORS: Record<string, string> = {
  vacant: "#ef4444",
  under_development: "#f97316",
  developed: "#22c55e",
};

const LAND_USE_COLORS: Record<string, string> = {
  residential: "#3b82f6",
  mixed_use: "#8b5cf6",
  commercial: "#f97316",
  industrial: "#6b7280",
};

export default function LandPanel({ parcels }: Props) {
  // Status breakdown
  const statusCount: Record<string, number> = {};
  for (const p of parcels) {
    statusCount[p.current_status] = (statusCount[p.current_status] || 0) + 1;
  }

  // Land use breakdown
  const landUseCount: Record<string, number> = {};
  for (const p of parcels) {
    landUseCount[p.land_use] = (landUseCount[p.land_use] || 0) + 1;
  }
  const landUseData = Object.entries(landUseCount)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
    .sort((a, b) => b.value - a.value);

  // District dev potential (avg score)
  const districtScores: Record<string, { total: number; count: number }> = {};
  for (const p of parcels) {
    if (!districtScores[p.district]) districtScores[p.district] = { total: 0, count: 0 };
    districtScores[p.district].total += p.development_potential_score;
    districtScores[p.district].count++;
  }
  const devPotentialData = Object.entries(districtScores)
    .map(([district, v]) => ({
      district: district.length > 18 ? district.slice(0, 16) + "..." : district,
      score: Math.round(v.total / v.count),
      parcels: v.count,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  // Recommended uses
  const useCount: Record<string, number> = {};
  for (const p of parcels) {
    if (p.recommended_use) {
      useCount[p.recommended_use] = (useCount[p.recommended_use] || 0) + 1;
    }
  }
  const recommendedUses = Object.entries(useCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Total estimated value
  const totalValue = parcels.reduce((s, p) => s + (p.estimated_value_aed || 0), 0);
  const avgDevScore = parcels.length > 0
    ? Math.round(parcels.reduce((s, p) => s + p.development_potential_score, 0) / parcels.length)
    : 0;
  const avgInfraScore = parcels.length > 0
    ? Math.round(parcels.reduce((s, p) => s + p.infrastructure_score, 0) / parcels.length)
    : 0;

  // Top opportunity parcels (vacant with highest dev potential)
  const topParcels = parcels
    .filter((p) => p.current_status === "vacant")
    .sort((a, b) => b.development_potential_score - a.development_potential_score)
    .slice(0, 6);

  return (
    <div className="p-5 space-y-5 max-w-4xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white">Land & Development Intelligence</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {parcels.length} parcels · {(totalValue / 1e9).toFixed(1)}B AED estimated value
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Vacant", value: statusCount["vacant"] || 0, color: "#ef4444", icon: MapPin },
          { label: "Under Dev", value: statusCount["under_development"] || 0, color: "#f97316", icon: Layers },
          { label: "Avg Dev Score", value: avgDevScore, color: "#8b5cf6", icon: TrendingUp },
          { label: "Avg Infra Score", value: avgInfraScore, color: "#06b6d4", icon: Zap },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">{s.label}</p>
                <Icon size={11} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full opacity-5" style={{ backgroundColor: s.color }} />
            </div>
          );
        })}
      </div>

      {/* Development potential by district */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Development Potential by District</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={devPotentialData} margin={{ left: -10, right: 10, top: 5 }} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <YAxis type="category" dataKey="district" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={110} />
            <Tooltip {...CHART_TOOLTIP} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={14}>
              {devPotentialData.map((d, i) => (
                <Cell key={i} fill={d.score >= 65 ? "#8b5cf6" : d.score >= 50 ? "#3b82f6" : "#6b7280"} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Land use breakdown */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Land Use Distribution</h3>
          <div className="space-y-2">
            {landUseData.map((l) => {
              const pct = Math.round((l.value / parcels.length) * 100);
              const color = LAND_USE_COLORS[l.name.replace(/ /g, "_")] || "#6b7280";
              return (
                <div key={l.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 capitalize">{l.name}</span>
                    <span className="text-[10px] text-gray-400">{pct}% ({l.value})</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended uses */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Recommended Uses</h3>
          <div className="space-y-1.5">
            {recommendedUses.map(([use, count], i) => (
              <div key={use} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-4">{i + 1}</span>
                <span className="text-xs text-gray-300 capitalize flex-1">{use.replace(/_/g, " ")}</span>
                <span className="text-xs font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top opportunity parcels */}
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Zap size={12} className="text-purple-400" />
          </div>
          <h3 className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Top Development Opportunities</h3>
        </div>
        <div className="space-y-1.5">
          {topParcels.map((p) => (
            <div key={p.parcel_id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-200">{p.district}</span>
                  <span className="text-[9px] text-gray-500">· {p.zone}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500 capitalize">{p.land_use.replace(/_/g, " ")}</span>
                  <span className="text-[10px] text-gray-600">·</span>
                  <span className="text-[10px] text-gray-500">{p.parcel_size_sqm.toLocaleString()} sqm</span>
                  <span className="text-[10px] text-gray-600">·</span>
                  <span className="text-[10px] text-gray-500 capitalize">{p.recommended_use.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-purple-400">{p.development_potential_score}</span>
                <p className="text-[9px] text-gray-500">potential</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
