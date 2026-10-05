"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { loadAllData } from "@/lib/data";
import { analyzeGaps, generateRecommendations } from "@/lib/engine";
import { GapResult, Recommendation, Amenity, Listing, Transaction, Investor, Parcel } from "@/lib/types";
import { EMIRATE_COLORS } from "@/lib/uae-districts";
import DetailPanel from "@/components/DetailPanel";
import AIChatPanel from "@/components/AIChatPanel";
import LiveDataPanel from "@/components/LiveDataPanel";
import MarketPanel from "@/components/MarketPanel";
import LandPanel from "@/components/LandPanel";
import { Activity, MessageSquare, Map, Zap, AlertTriangle, Users, Building2, Radio, Globe, TrendingUp, Layers } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type ViewMode = "map" | "chat" | "live" | "market" | "land";

interface DistrictMeta {
  name: string;
  emirate: string;
}

export default function Home() {
  const [gaps, setGaps] = useState<GapResult[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [amenityData, setAmenityData] = useState<Amenity[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("map");
  const [loading, setLoading] = useState(true);
  const [emirateFilter, setEmirateFilter] = useState<string>("all");
  const [districtMeta, setDistrictMeta] = useState<DistrictMeta[]>([]);

  useEffect(() => {
    Promise.all([
      loadAllData(),
      fetch(withBasePath("/uae_real_amenities.json")).then((r) => r.json()),
    ]).then(([allData, realData]) => {
      const { communities, amenities, districts, osmAmenities, listings: ls, transactions: tx, investors: inv, parcels: pc } = allData;
      const gapResults = analyzeGaps(communities, amenities, districts);
      setGaps(gapResults);
      setRecommendations(generateRecommendations(gapResults));
      setAmenityData(osmAmenities);
      setListings(ls);
      setTransactions(tx);
      setInvestors(inv);
      setParcels(pc);
      setDistrictMeta(realData.districts.map((d: any) => ({ name: d.name, emirate: d.emirate })));
      if (gapResults.length > 0) setSelected(gapResults[0].district);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <p className="text-sm text-gray-400">Loading real data across UAE...</p>
        </div>
      </div>
    );
  }

  function getEmirate(districtName: string): string {
    return districtMeta.find((d) => d.name === districtName)?.emirate || "Abu Dhabi";
  }

  const filteredGaps = emirateFilter === "all"
    ? gaps
    : gaps.filter((g) => getEmirate(g.district) === emirateFilter);

  const selectedGap = gaps.find((g) => g.district === selected) || null;
  const criticalCount = filteredGaps.filter((g) => g.severity === "critical").length;
  const totalPop = filteredGaps.reduce((s, g) => s + g.population, 0);
  const underserved = filteredGaps.filter((g) => g.gapScore > 50).reduce((s, g) => s + g.population, 0);

  const emirates = ["all", ...Object.keys(EMIRATE_COLORS)];

  return (
    <div className="h-screen flex flex-col bg-[#0f1117] text-white">
      {/* Header */}
      <header className="h-14 border-b border-white/5 flex items-center px-5 shrink-0 bg-[#0f1117]/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold tracking-tight block leading-tight">Xpand</span>
            <span className="text-[10px] text-gray-500 leading-tight">Urban Intelligence Platform · UAE</span>
          </div>
        </div>

        {/* View toggle */}
        <div className="ml-6 flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
          {([
            { key: "map", label: "Map", icon: Map },
            { key: "market", label: "Market", icon: TrendingUp },
            { key: "land", label: "Land", icon: Layers },
            { key: "chat", label: "Ask AI", icon: MessageSquare },
            { key: "live", label: "Live", icon: Radio },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === key ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Stats chips */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <Globe size={11} className="text-cyan-400" />
              <span className="text-cyan-400 font-semibold">7</span> emirates
            </span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-red-400" />
              <span className="text-red-400 font-semibold">{criticalCount}</span> critical
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={11} />
              {(underserved / 1000).toFixed(0)}k underserved
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 size={11} />
              {gaps.length} districts
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-[10px] font-medium text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-md border border-cyan-400/20">
            Future Communities
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - district list */}
        <aside className="w-72 border-r border-white/5 flex flex-col shrink-0 bg-[#13151b]">
          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-2 p-3 border-b border-white/5">
            <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl p-3 border border-red-500/10">
              <p className="text-[9px] text-red-400/70 uppercase tracking-wider font-medium">Critical Areas</p>
              <p className="text-2xl font-bold text-red-400 mt-0.5">{criticalCount}</p>
            </div>
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-xl p-3 border border-white/5">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">Population</p>
              <p className="text-2xl font-bold text-white mt-0.5">{(totalPop / 1e6).toFixed(1)}M</p>
            </div>
          </div>

          {/* Emirate filter */}
          <div className="px-3 pt-3 pb-2 border-b border-white/5">
            <div className="flex flex-wrap gap-1">
              {emirates.map((em) => (
                <button
                  key={em}
                  onClick={() => setEmirateFilter(em)}
                  className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                    emirateFilter === em
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-gray-500 hover:text-gray-300 border border-transparent hover:border-white/10"
                  }`}
                  style={
                    emirateFilter === em && em !== "all"
                      ? { backgroundColor: (EMIRATE_COLORS[em] || "#fff") + "20", color: EMIRATE_COLORS[em], borderColor: (EMIRATE_COLORS[em] || "#fff") + "40" }
                      : undefined
                  }
                >
                  {em === "all" ? "All UAE" : em}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-3 pb-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                {emirateFilter === "all" ? "All districts" : emirateFilter} · gap severity
              </p>
            </div>
            <div className="px-2 pb-3 space-y-0.5">
              {filteredGaps.map((g, i) => {
                const emirate = getEmirate(g.district);
                const emColor = EMIRATE_COLORS[emirate] || "#3b82f6";
                return (
                  <button
                    key={g.district}
                    onClick={() => setSelected(g.district)}
                    className={`w-full text-left rounded-xl px-3 py-3 transition-all duration-200 ${
                      selected === g.district
                        ? "bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                        : "hover:bg-white/[0.04] border border-transparent hover:border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold text-gray-600 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: emColor }} />
                            <span className="text-[13px] font-semibold text-gray-100 truncate">{g.district}</span>
                          </div>
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg min-w-[36px] text-center shrink-0"
                            style={{
                              backgroundColor: COLORS[g.severity] + "18",
                              color: COLORS[g.severity],
                              border: `1px solid ${COLORS[g.severity]}25`,
                            }}
                          >
                            {g.gapScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-gray-500">{(g.population / 1000).toFixed(0)}k pop</span>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] text-gray-500">{g.totalAmenities} amenities</span>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] font-medium" style={{ color: COLORS[g.severity] }}>{g.amenitiesPer10k}/10k</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                          <div
                            className="h-1 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(g.gapScore, 100)}%`, backgroundColor: COLORS[g.severity] }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1 relative">
          {view === "map" && (
            <MapView gaps={gaps} amenities={amenityData} selected={selected} onSelect={setSelected} />
          )}
          {view === "market" && (
            <div className="h-full bg-[#13151b] overflow-y-auto">
              <MarketPanel listings={listings} transactions={transactions} investors={investors} />
            </div>
          )}
          {view === "land" && (
            <div className="h-full bg-[#13151b] overflow-y-auto">
              <LandPanel parcels={parcels} />
            </div>
          )}
          {view === "chat" && (
            <div className="h-full bg-[#13151b]">
              <AIChatPanel gaps={gaps} recommendations={recommendations} />
            </div>
          )}
          {view === "live" && (
            <div className="h-full bg-[#13151b] overflow-y-auto">
              <LiveDataPanel />
            </div>
          )}
        </main>

        {/* Right - detail panel */}
        <aside className="w-[380px] border-l border-white/5 shrink-0 bg-[#13151b] overflow-y-auto">
          <DetailPanel
            gap={selectedGap}
            allGaps={gaps}
            recommendations={recommendations}
            listings={listings}
            transactions={transactions}
            investors={investors}
            parcels={parcels}
          />
        </aside>
      </div>
    </div>
  );
}

const COLORS: Record<string, string> = {
  critical: "#ef4444",
  significant: "#f97316",
  emerging: "#eab308",
  adequate: "#22c55e",
};
