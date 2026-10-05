"use client";

import { GapResult } from "@/lib/types";
import { AlertTriangle, Users, MapPin, TrendingUp } from "lucide-react";

const SEVERITY_STYLES = {
  critical: "bg-red-50 border-red-200 text-red-700",
  significant: "bg-orange-50 border-orange-200 text-orange-700",
  emerging: "bg-yellow-50 border-yellow-200 text-yellow-700",
  adequate: "bg-green-50 border-green-200 text-green-700",
};

interface Props {
  gaps: GapResult[];
  selected: string | null;
  onSelect: (d: string) => void;
}

export default function Sidebar({ gaps, selected, onSelect }: Props) {
  const totalPop = gaps.reduce((s, g) => s + g.population, 0);
  const criticalCount = gaps.filter((g) => g.severity === "critical").length;
  const underservedPop = gaps.filter((g) => g.gapScore > 50).reduce((s, g) => s + g.population, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 p-4 border-b border-gray-100">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <AlertTriangle size={12} />
            <span className="text-[10px] uppercase tracking-wide font-medium">Critical</span>
          </div>
          <p className="text-xl font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <Users size={12} />
            <span className="text-[10px] uppercase tracking-wide font-medium">Underserved</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{(underservedPop / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <MapPin size={12} />
            <span className="text-[10px] uppercase tracking-wide font-medium">Districts</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{gaps.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <TrendingUp size={12} />
            <span className="text-[10px] uppercase tracking-wide font-medium">Population</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{(totalPop / 1000000).toFixed(1)}M</p>
        </div>
      </div>

      {/* District list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Districts by gap severity</h3>
        </div>
        <div className="space-y-1 px-2 pb-4">
          {gaps.map((g) => (
            <button
              key={g.district}
              onClick={() => onSelect(g.district)}
              className={`w-full text-left rounded-lg p-3 transition-all ${
                selected === g.district ? "bg-blue-50 border border-blue-200 shadow-sm" : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 truncate">{g.district}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[g.severity]}`}>
                  {g.gapScore}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                <span>{(g.population / 1000).toFixed(0)}k pop</span>
                <span>{g.totalAmenities} amenities</span>
                <span>{g.amenitiesPer10k}/10k</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
