"use client";

import { useEffect, useState } from "react";
import { Radio, RefreshCw, Database, CheckCircle2 } from "lucide-react";
import { EMIRATE_COLORS } from "@/lib/uae-districts";
import { withBasePath } from "@/lib/base-path";
import { fetchLiveByEmirate, fetchLiveDistrict } from "@/lib/live-data";

interface LiveResult {
  district: string;
  emirate?: string;
  education: number;
  healthcare: number;
  retail: number;
  mobility: number;
  community: number;
  total: number;
}

interface DistrictOption {
  name: string;
  emirate: string;
}

const EMIRATES = ["All UAE", "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

export default function LiveDataPanel() {
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [results, setResults] = useState<LiveResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedEmirate, setSelectedEmirate] = useState("All UAE");
  const [singleResult, setSingleResult] = useState<LiveResult | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  useEffect(() => {
    fetch(withBasePath("/uae_real_amenities.json"))
      .then((r) => r.json())
      .then((data) => {
        const list = data.districts.map((d: any) => ({ name: d.name, emirate: d.emirate }));
        setDistricts(list);
        if (list.length > 0) setSelectedDistrict(list[0].name);
      });
  }, []);

  async function fetchByEmirate() {
    setLoading(true);
    try {
      const data = await fetchLiveByEmirate(selectedEmirate === "All UAE" ? null : selectedEmirate);
      setResults(data.results);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function fetchSingle() {
    setSingleLoading(true);
    try {
      const data = await fetchLiveDistrict(selectedDistrict);
      setSingleResult(data);
    } catch (e) {
      console.error(e);
    }
    setSingleLoading(false);
  }

  return (
    <div className="p-5 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h2 className="text-base font-bold text-white">Live Data Source</h2>
        </div>
        <p className="text-xs text-gray-400">
          Real-time amenity data from OpenStreetMap via Overpass API. All data is real — queried from OSM&apos;s global database covering 33 UAE districts across 7 emirates.
        </p>
      </div>

      {/* Single district query */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Query Single District (Live)</h3>
        <div className="flex gap-2">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            {districts.map((d) => (
              <option key={d.name} value={d.name} className="bg-gray-900">
                {d.name} ({d.emirate})
              </option>
            ))}
          </select>
          <button
            onClick={fetchSingle}
            disabled={singleLoading}
            className="flex items-center gap-1.5 text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-4 py-2 rounded-lg hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={singleLoading ? "animate-spin" : ""} />
            Query
          </button>
        </div>

        {singleResult && (
          <div className="mt-4 grid grid-cols-6 gap-2">
            {[
              { label: "Education", value: singleResult.education, color: "#3b82f6" },
              { label: "Healthcare", value: singleResult.healthcare, color: "#ef4444" },
              { label: "Retail", value: singleResult.retail, color: "#a855f7" },
              { label: "Transit", value: singleResult.mobility, color: "#f97316" },
              { label: "Community", value: singleResult.community, color: "#22c55e" },
              { label: "Total", value: singleResult.total, color: "#ffffff" },
            ].map((c) => (
              <div key={c.label} className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full scan by emirate */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Emirate Scan (Live)</h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedEmirate}
              onChange={(e) => setSelectedEmirate(e.target.value)}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none"
            >
              {EMIRATES.map((em) => (
                <option key={em} value={em} className="bg-gray-900">{em}</option>
              ))}
            </select>
            <button
              onClick={fetchByEmirate}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              <Radio size={11} className={loading ? "animate-pulse" : ""} />
              {loading ? "Scanning..." : "Scan"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
            <RefreshCw size={12} className="animate-spin" />
            <span>Querying Overpass API live for {selectedEmirate === "All UAE" ? "all 33" : selectedEmirate} districts (~2s per query)...</span>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
            <Database size={12} />
            <span>Select an emirate and click &quot;Scan&quot; to pull live amenity counts from OpenStreetMap.</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-green-400 mb-2">
              <CheckCircle2 size={10} />
              <span>Live from OpenStreetMap · {results.length} districts scanned</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-[400px] overflow-y-auto">
              {results.sort((a, b) => a.total - b.total).map((r) => {
                const emColor = EMIRATE_COLORS[r.emirate || ""] || "#6b7280";
                return (
                  <div key={r.district} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: emColor }} />
                    <span className="text-xs font-medium text-gray-200 w-44 truncate">{r.district}</span>
                    <div className="flex-1 grid grid-cols-5 gap-2 text-center">
                      <span className="text-[10px] text-blue-400">{r.education}</span>
                      <span className="text-[10px] text-red-400">{r.healthcare}</span>
                      <span className="text-[10px] text-purple-400">{r.retail}</span>
                      <span className="text-[10px] text-orange-400">{r.mobility}</span>
                      <span className="text-[10px] text-green-400">{r.community}</span>
                    </div>
                    <span className="text-xs font-bold text-white w-10 text-right">{r.total}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-gray-600 mt-2 px-1">
              <span>Columns: Edu · Health · Retail · Transit · Community · Total</span>
              <span>Data © OpenStreetMap contributors</span>
            </div>
          </div>
        )}
      </div>

      {/* Data source info */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Data Sources</h3>
        <div className="space-y-2">
          {[
            { name: "OpenStreetMap Overpass API", status: "live", desc: "Real-time amenity queries — schools, clinics, transit, parks across all UAE" },
            { name: "Pre-fetched OSM Snapshot", status: "cached", desc: "31,128 real amenities across 33 districts fetched from OSM (updated at build time)" },
            { name: "Population Estimates", status: "reference", desc: "Based on SCAD, DSC, and UAE Federal statistics references" },
          ].map((s) => (
            <div key={s.name} className="flex items-start gap-2">
              {s.status === "live" ? (
                <div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-300 font-medium">{s.name}</p>
                <p className="text-[10px] text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
