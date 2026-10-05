"use client";

import { Listing, Transaction, Investor } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from "recharts";
import { TrendingUp, Home, DollarSign, Users, Building2 } from "lucide-react";

interface Props {
  listings: Listing[];
  transactions: Transaction[];
  investors: Investor[];
}

const CHART_TOOLTIP = {
  contentStyle: { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "11px", color: "#e5e7eb" },
};

export default function MarketPanel({ listings, transactions, investors }: Props) {
  // Compute stats
  const avgPricePerSqm = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + (l.price_per_sqm_aed || 0), 0) / listings.length)
    : 0;
  const totalVolume = transactions.reduce((s, t) => s + (t.transaction_value_aed || 0), 0);
  const rentListings = listings.filter((l) => l.listing_type === "rent").length;
  const saleListings = listings.filter((l) => l.listing_type === "sale").length;

  // District price comparison (top 10 by avg price)
  const districtPrices: Record<string, { total: number; count: number }> = {};
  for (const l of listings) {
    if (!l.district || !l.price_per_sqm_aed) continue;
    if (!districtPrices[l.district]) districtPrices[l.district] = { total: 0, count: 0 };
    districtPrices[l.district].total += l.price_per_sqm_aed;
    districtPrices[l.district].count++;
  }
  const priceData = Object.entries(districtPrices)
    .map(([district, v]) => ({ district: district.length > 18 ? district.slice(0, 16) + "..." : district, avg: Math.round(v.total / v.count) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  // Property type breakdown
  const typeCount: Record<string, number> = {};
  for (const l of listings) {
    typeCount[l.property_type] = (typeCount[l.property_type] || 0) + 1;
  }
  const typeData = Object.entries(typeCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Monthly transaction volume
  const monthlyVol: Record<string, number> = {};
  for (const t of transactions) {
    if (!t.date) continue;
    const month = t.date.slice(0, 7);
    monthlyVol[month] = (monthlyVol[month] || 0) + (t.transaction_value_aed || 0);
  }
  const monthlyData = Object.entries(monthlyVol)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, volume]) => ({ month: month.slice(2), volume: Math.round(volume / 1e6) }));

  // Buyer type breakdown
  const buyerTypes: Record<string, number> = {};
  for (const t of transactions) {
    buyerTypes[t.buyer_type] = (buyerTypes[t.buyer_type] || 0) + 1;
  }
  const buyerData = Object.entries(buyerTypes).map(([name, value]) => ({ name, value }));

  // Top investors
  const topInvestors = [...investors]
    .sort((a, b) => b.strategic_fit_score - a.strategic_fit_score)
    .slice(0, 8);

  const TYPE_COLORS = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#ef4444", "#06b6d4"];

  return (
    <div className="p-5 space-y-5 max-w-4xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white">Property Market Intelligence</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {listings.length.toLocaleString()} listings · {transactions.length.toLocaleString()} transactions · {investors.length} investors
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Avg Price/sqm", value: `${(avgPricePerSqm / 1000).toFixed(1)}k`, sub: "AED", icon: DollarSign, color: "#3b82f6" },
          { label: "For Rent", value: rentListings.toLocaleString(), sub: "listings", icon: Home, color: "#22c55e" },
          { label: "For Sale", value: saleListings.toLocaleString(), sub: "listings", icon: Building2, color: "#8b5cf6" },
          { label: "Transaction Vol", value: `${(totalVolume / 1e9).toFixed(1)}B`, sub: "AED", icon: TrendingUp, color: "#f97316" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">{s.label}</p>
                <Icon size={11} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.sub}</p>
              <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full opacity-5" style={{ backgroundColor: s.color }} />
            </div>
          );
        })}
      </div>

      {/* District price comparison */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Avg Price per sqm by District (AED)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={priceData} margin={{ left: -10, right: 10, top: 5 }} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="district" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={110} />
            <Tooltip {...CHART_TOOLTIP} />
            <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={14} fill="#3b82f6" fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Property type breakdown */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Property Types</h3>
          <div className="space-y-2">
            {typeData.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                <span className="text-xs text-gray-300 capitalize flex-1">{t.name}</span>
                <span className="text-xs font-bold text-white">{t.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer type breakdown */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Buyer Types</h3>
          <div className="space-y-2">
            {buyerData.map((b, i) => {
              const pct = transactions.length > 0 ? Math.round((b.value / transactions.length) * 100) : 0;
              return (
                <div key={b.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 capitalize">{b.name}</span>
                    <span className="text-[10px] text-gray-400">{pct}% ({b.value.toLocaleString()})</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly transaction volume */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Monthly Transaction Volume (AED M)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthlyData} margin={{ left: -10, right: 10, top: 5 }}>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip {...CHART_TOOLTIP} />
            <Line type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top investors */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={12} className="text-cyan-400" />
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Top Investors by Strategic Fit</h3>
        </div>
        <div className="space-y-1.5">
          {topInvestors.map((inv) => (
            <div key={inv.investor_id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-200 capitalize">{inv.investor_type.replace(/_/g, " ")}</span>
                  <span className="text-[9px] text-gray-500 capitalize">· {inv.preferred_sector}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">{inv.preferred_district}</span>
                  <span className="text-[10px] text-gray-600">·</span>
                  <span className="text-[10px] text-gray-500 capitalize">{inv.risk_profile}</span>
                  <span className="text-[10px] text-gray-600">·</span>
                  <span className="text-[10px] text-gray-500">{inv.capital_range_aed}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-cyan-400">{inv.strategic_fit_score}</span>
                <p className="text-[9px] text-gray-500">fit score</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
