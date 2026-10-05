"use client";

import { useEffect, useRef, useState } from "react";
import { GapResult, Amenity } from "@/lib/types";
import { getDistrictInsight } from "@/lib/engine";
import { EMIRATE_COLORS } from "@/lib/uae-districts";
import { withBasePath } from "@/lib/base-path";

const COLORS = {
  critical: "#ef4444",
  significant: "#f97316",
  emerging: "#eab308",
  adequate: "#22c55e",
};

const AMENITY_ICONS: Record<string, { emoji: string; color: string }> = {
  education: { emoji: "🏫", color: "#3b82f6" },
  healthcare: { emoji: "🏥", color: "#ef4444" },
  retail: { emoji: "🛒", color: "#a855f7" },
  mobility: { emoji: "🚌", color: "#f97316" },
  community: { emoji: "🌳", color: "#22c55e" },
  services: { emoji: "🏛️", color: "#6b7280" },
};

interface DistrictInfo {
  name: string;
  emirate: string;
  bounds: [number, number, number, number];
}

interface Props {
  gaps: GapResult[];
  amenities: Amenity[];
  selected: string | null;
  onSelect: (d: string) => void;
}

export default function MapView({ gaps, amenities, selected, onSelect }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const amenityLayerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [districtInfo, setDistrictInfo] = useState<DistrictInfo[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const LRef = useRef<any>(null);

  // Load district metadata
  useEffect(() => {
    fetch(withBasePath("/uae_real_amenities.json"))
      .then((r) => r.json())
      .then((data) => {
        setDistrictInfo(
          data.districts.map((d: any) => ({ name: d.name, emirate: d.emirate, bounds: d.bounds }))
        );
      });
  }, []);

  useEffect(() => {
    if (!mapContainer.current || districtInfo.length === 0 || gaps.length === 0) return;
    if (mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      LRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapContainer.current!, {
        center: [24.8, 55.0],
        zoom: 8,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OSM &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Draw colored zone rectangles
      for (const g of gaps) {
        const info = districtInfo.find((d) => d.name === g.district);
        if (!info) continue;
        const [s, w, n, e] = info.bounds;
        const color = COLORS[g.severity];
        const emirateColor = EMIRATE_COLORS[info.emirate] || "#3b82f6";

        const polygon = L.rectangle([[s, w], [n, e]], {
          color: emirateColor,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 2,
          opacity: 0.6,
          dashArray: "4 4",
        });
        polygon.on("click", () => onSelectRef.current(g.district));
        polygon.addTo(map);
      }

      // Draw circle markers
      for (const g of gaps) {
        if (!g.lat || !g.lng) continue;
        const color = COLORS[g.severity];
        const radius = Math.max(18, g.gapScore / 2.2);
        const info = districtInfo.find((d) => d.name === g.district);
        const emirate = info?.emirate || "Abu Dhabi";

        // Glow
        L.circleMarker([g.lat, g.lng], {
          radius: radius + 5,
          color: "transparent",
          fillColor: color,
          fillOpacity: 0.12,
          weight: 0,
        }).addTo(map);

        // Main circle
        const circle = L.circleMarker([g.lat, g.lng], {
          radius,
          color: "#ffffff",
          fillColor: color,
          fillOpacity: 0.8,
          weight: 2.5,
        });

        circle.bindTooltip(
          `<div style="font-family:Inter,system-ui,sans-serif;padding:6px 4px">
            <div style="font-size:14px;font-weight:700;color:#1f2937">${g.district}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:2px">${emirate}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:3px">Gap: <b style="color:${color}">${g.gapScore}/100</b></div>
            <div style="font-size:11px;color:#9ca3af;margin-top:2px">${g.population.toLocaleString()} residents · ${g.totalAmenities} amenities</div>
            <div style="font-size:11px;color:#9ca3af">${g.amenitiesPer10k} per 10,000 people</div>
          </div>`,
          { direction: "top", offset: [0, -radius - 6] }
        );

        circle.on("click", () => onSelectRef.current(g.district));
        circle.addTo(map);

        // Score inside circle
        L.marker([g.lat, g.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="font-size:11px;font-weight:800;color:white;text-align:center;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,0.5)">${g.gapScore}</div>`,
            iconSize: [26, 14],
            iconAnchor: [13, 7],
          }),
          interactive: false,
        }).addTo(map);

        // Name label
        L.marker([g.lat, g.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="font-size:10px;font-weight:700;color:#1e293b;text-align:center;white-space:nowrap;text-shadow:0 0 3px white,0 0 3px white,0 0 3px white,0 0 3px white;letter-spacing:-0.2px">${g.district}</div>`,
            iconSize: [120, 16],
            iconAnchor: [60, -radius - 6],
          }),
          interactive: false,
        }).addTo(map);
      }

      // Amenity layer
      amenityLayerRef.current = L.layerGroup();

      map.on("zoomend", () => {
        const zoom = map.getZoom();
        if (zoom >= 13) {
          if (!map.hasLayer(amenityLayerRef.current)) {
            map.addLayer(amenityLayerRef.current);
          }
        } else {
          if (map.hasLayer(amenityLayerRef.current)) {
            map.removeLayer(amenityLayerRef.current);
          }
        }
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
      setReady(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gaps, districtInfo]);

  // Update amenity pins when selected district changes
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current || !amenityLayerRef.current) return;
    const L = LRef.current;

    amenityLayerRef.current.clearLayers();

    const districtAmenities = selected
      ? amenities.filter((a) => a.district === selected)
      : amenities.slice(0, 200);

    for (const a of districtAmenities) {
      if (!a.latitude || !a.longitude) continue;
      const info = AMENITY_ICONS[a.category] || { emoji: "📍", color: "#6b7280" };

      const marker = L.marker([a.latitude, a.longitude], {
        icon: L.divIcon({
          className: "",
          html: `<div style="font-size:16px;text-align:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${info.emoji}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      });

      marker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;padding:2px">
          <div style="font-size:12px;font-weight:600;color:#1f2937">${a.name}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:1px;text-transform:capitalize">${a.category}</div>
        </div>`,
        { direction: "top" }
      );

      marker.addTo(amenityLayerRef.current);
    }
  }, [selected, amenities]);

  // Zoom to selected district
  useEffect(() => {
    if (!mapInstanceRef.current || !selected) return;
    const gap = gaps.find((g) => g.district === selected);
    if (gap && gap.lat && gap.lng) {
      mapInstanceRef.current.flyTo([gap.lat, gap.lng], 13.5, { duration: 1 });
    }
  }, [selected, gaps]);

  const selectedGap = gaps.find((g) => g.district === selected);
  const selectedEmirate = districtInfo.find((d) => d.name === selected)?.emirate || "";

  return (
    <div className="relative w-full h-full" style={{ minHeight: "500px" }}>
      <div ref={mapContainer} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} />

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-[1000] border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Gap Severity</p>
        {(["critical", "significant", "emerging", "adequate"] as const).map((s) => (
          <div key={s} className="flex items-center gap-2 py-0.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: COLORS[s] }} />
            <span className="text-[11px] text-gray-700 capitalize font-medium">{s}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 mt-2 pt-2">
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Emirates</p>
          {Object.entries(EMIRATE_COLORS).map(([em, col]) => (
            <div key={em} className="flex items-center gap-2 py-0.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: col }} />
              <span className="text-[10px] text-gray-600">{em}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-2 pt-2">
          <p className="text-[10px] text-gray-400">Real OSM data · 31k+ amenities</p>
        </div>
      </div>

      {/* Selected district card */}
      {ready && selectedGap && (
        <div className="absolute bottom-5 left-5 max-w-md bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-2xl z-[1000] border border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{selectedGap.district}</h3>
              <p className="text-[10px] text-gray-500">{selectedEmirate}</p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider"
              style={{ backgroundColor: COLORS[selectedGap.severity] }}
            >
              {selectedGap.severity} · {selectedGap.gapScore}
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">{getDistrictInsight(selectedGap)}</p>
          <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
            <span>🏫 {selectedGap.categories.education}</span>
            <span>🏥 {selectedGap.categories.healthcare}</span>
            <span>🚌 {selectedGap.categories.mobility}</span>
            <span>🛒 {selectedGap.categories.retail}</span>
            <span>🌳 {selectedGap.categories.community}</span>
          </div>
        </div>
      )}
    </div>
  );
}
