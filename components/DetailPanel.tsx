"use client";

import { GapResult, Recommendation, Listing, Transaction, Investor, Parcel } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingDown, TrendingUp, Target, Lightbulb, Home, DollarSign, MapPin, Users } from "lucide-react";

const SEVERITY_COLORS = {
  critical: "#ef4444",
  significant: "#f97316",
  emerging: "#eab308",
  adequate: "#22c55e",
};

const CAT_COLORS: Record<string, string> = {
  education: "#3b82f6",
  healthcare: "#ef4444",
  mobility: "#f97316",
  retail: "#a855f7",
  community: "#22c55e",
  services: "#6b7280",
};

const CAT_LABELS: Record<string, string> = {
  education: "Education",
  healthcare: "Healthcare",
  mobility: "Transit",
  retail: "Retail",
  community: "Parks & Community",
  services: "Services",
};

interface Props {
  gap: GapResult | null;
  allGaps: GapResult[];
  recommendations: Recommendation[];
  listings: Listing[];
  transactions: Transaction[];
  investors: Investor[];
  parcels: Parcel[];
}

export default function DetailPanel({ gap, allGaps, recommendations, listings, transactions, investors, parcels }: Props) {
  if (!gap) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <Target size={32} className="text-gray-600 mb-3" />
        <p className="text-sm text-gray-400 font-medium">Select a district</p>
        <p className="text-xs text-gray-600 mt-1">Click on the map or sidebar to view gap analysis</p>
      </div>
    );
  }

  const catData = Object.entries(gap.categories)
    .map(([cat, count]) => ({
      category: CAT_LABELS[cat] || cat,
      fullName: cat,
      value: gap.population > 0 ? Math.round((count / gap.population) * 10000 * 100) / 100 : 0,
      count,
    }))
    .sort((a, b) => a.value - b.value);

  const rank = allGaps.findIndex((g) => g.district === gap.district) + 1;
  const rec = recommendations.find((r) => r.district === gap.district);

  // District-specific market data
  const distListings = listings.filter((l) => l.district === gap.district);
  const distTransactions = transactions.filter((t) => t.district === gap.district);
  const distInvestors = investors.filter((inv) => inv.preferred_district === gap.district);
  const distParcels = parcels.filter((p) => p.district === gap.district);

  const avgPrice = distListings.length > 0
    ? Math.round(distListings.reduce((s, l) => s + (l.price_per_sqm_aed || 0), 0) / distListings.length)
    : 0;
  const totalTxValue = distTransactions.reduce((s, t) => s + (t.transaction_value_aed || 0), 0);
  const avgDevPotential = distParcels.length > 0
    ? Math.round(distParcels.reduce((s, p) => s + p.development_potential_score, 0) / distParcels.length)
    : 0;

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{gap.district}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {gap.population.toLocaleString()} residents · {gap.totalAmenities} amenities
          </p>
        </div>
        <div className="text-right">
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider"
            style={{
              backgroundColor: SEVERITY_COLORS[gap.severity] + "20",
              color: SEVERITY_COLORS[gap.severity],
              border: `1px solid ${SEVERITY_COLORS[gap.severity]}30`,
            }}
          >
            {gap.severity}
          </span>
          <p className="text-[10px] text-gray-500 mt-1">Rank #{rank} of {allGaps.length}</p>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Gap Score", value: gap.gapScore, color: SEVERITY_COLORS[gap.severity], icon: gap.gapScore > 50 ? TrendingDown : TrendingUp },
          { label: "Demand", value: gap.demandIndex, color: "#818cf8", icon: TrendingUp },
          { label: "Mobility", value: gap.mobilityScore, color: "#06b6d4", icon: TrendingUp },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">{s.label}</p>
                <Icon size={10} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>
                {s.value}
              </p>
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(s.value, 100)}%`, backgroundColor: s.color }}
                />
              </div>
              <div className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full opacity-5" style={{ backgroundColor: s.color }} />
            </div>
          );
        })}
      </div>

      {/* Amenity per 10k metric */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center border-2" style={{ borderColor: SEVERITY_COLORS[gap.severity] + "50" }}>
          <span className="text-lg font-bold" style={{ color: SEVERITY_COLORS[gap.severity] }}>{gap.amenitiesPer10k}</span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-200">Amenities per 10,000 residents</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            City average: {(allGaps.reduce((s, g) => s + g.amenitiesPer10k, 0) / allGaps.length).toFixed(1)} per 10k
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-3">
          Service breakdown (per 10k residents)
        </h3>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={catData} margin={{ left: -10, right: 5, top: 5 }} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "11px", color: "#e5e7eb" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                {catData.map((d) => (
                  <Cell key={d.fullName} fill={CAT_COLORS[d.fullName] || "#6b7280"} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weakest services callout */}
      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
        <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold mb-1.5">Gaps identified</p>
        <div className="space-y-1.5">
          {catData.slice(0, 3).map((d) => (
            <div key={d.fullName} className="flex items-center justify-between">
              <span className="text-xs text-gray-300">{d.category}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-200">{d.count} facilities</span>
                <span className="text-[10px] text-gray-500">({d.value}/10k)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Property Market Section */}
      {distListings.length > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Home size={11} className="text-blue-400" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Property Market</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{distListings.length}</p>
              <p className="text-[9px] text-gray-500">Listings</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-400">{(avgPrice / 1000).toFixed(1)}k</p>
              <p className="text-[9px] text-gray-500">Avg AED/sqm</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{distListings.filter((l) => l.listing_type === "rent").length}</p>
              <p className="text-[9px] text-gray-500">For Rent</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Activity */}
      {distTransactions.length > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <DollarSign size={11} className="text-orange-400" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Transaction Activity</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-orange-400">{distTransactions.length}</p>
              <p className="text-[9px] text-gray-500">Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-400">{(totalTxValue / 1e6).toFixed(0)}M</p>
              <p className="text-[9px] text-gray-500">Total AED</p>
            </div>
          </div>
        </div>
      )}

      {/* Land Parcels */}
      {distParcels.length > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <MapPin size={11} className="text-purple-400" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Land Parcels</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold text-purple-400">{distParcels.length}</p>
              <p className="text-[9px] text-gray-500">Parcels</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-cyan-400">{avgDevPotential}</p>
              <p className="text-[9px] text-gray-500">Dev Score</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{distParcels.filter((p) => p.current_status === "vacant").length}</p>
              <p className="text-[9px] text-gray-500">Vacant</p>
            </div>
          </div>
          {distParcels.length > 0 && (
            <div className="mt-2 space-y-1">
              {distParcels.slice(0, 3).map((p) => (
                <div key={p.parcel_id} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 capitalize">{p.recommended_use.replace(/_/g, " ")}</span>
                  <span className="text-gray-300">{p.parcel_size_sqm.toLocaleString()} sqm</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Investor Interest */}
      {distInvestors.length > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Users size={11} className="text-cyan-400" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Investor Interest</p>
          </div>
          <p className="text-lg font-bold text-cyan-400">{distInvestors.length} <span className="text-xs font-normal text-gray-400">investors targeting this district</span></p>
          <div className="mt-2 space-y-1">
            {distInvestors.slice(0, 3).map((inv) => (
              <div key={inv.investor_id} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400 capitalize">{inv.investor_type.replace(/_/g, " ")} · {inv.preferred_sector}</span>
                <span className="text-gray-300">{inv.capital_range_aed}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {rec && (
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/15 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Lightbulb size={12} className="text-blue-400" />
            </div>
            <span className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">AI Recommendation</span>
          </div>
          <p className="text-sm font-semibold text-white">{rec.action}</p>
          <div className="mt-2.5 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Weakest service</span>
              <span className="text-blue-300 font-medium capitalize">{rec.weakest}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Data signal</span>
              <span className="text-blue-300 font-medium">&ldquo;{rec.signal}&rdquo;</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Residents impacted</span>
              <span className="text-blue-300 font-medium">{rec.population.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
