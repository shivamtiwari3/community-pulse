"use client";

import { useState, useRef, useEffect } from "react";
import { GapResult, Recommendation } from "@/lib/types";
import { getDistrictInsight } from "@/lib/engine";
import { Send, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  gaps: GapResult[];
  recommendations: Recommendation[];
}

function generateAnswer(query: string, gaps: GapResult[], recommendations: Recommendation[]): string {
  const q = query.toLowerCase();

  const matchedDistrict = gaps.find((g) => q.includes(g.district.toLowerCase()));
  if (matchedDistrict) {
    const rec = recommendations.find((r) => r.district === matchedDistrict.district);
    let answer = getDistrictInsight(matchedDistrict);
    if (rec) answer += `\n\nRecommendation: ${rec.action}. This would benefit ${rec.population.toLocaleString()} residents.`;
    return answer;
  }

  if (q.includes("worst") || q.includes("critical") || q.includes("highest gap")) {
    const top3 = gaps.slice(0, 3);
    return `Top 3 critical districts:\n\n${top3
      .map((g, i) => `${i + 1}. ${g.district} — Gap ${g.gapScore}/100, ${g.population.toLocaleString()} residents, ${g.amenitiesPer10k} amenities/10k`)
      .join("\n")}`;
  }

  if (q.includes("school") || q.includes("education")) {
    const sorted = [...gaps].sort((a, b) => {
      const aR = a.population > 0 ? (a.categories.education / a.population) * 10000 : 99;
      const bR = b.population > 0 ? (b.categories.education / b.population) * 10000 : 99;
      return aR - bR;
    });
    return `Worst education access:\n\n${sorted.slice(0, 3)
      .map((g) => `• ${g.district} — ${g.categories.education} schools for ${g.population.toLocaleString()} people`)
      .join("\n")}`;
  }

  if (q.includes("health") || q.includes("clinic") || q.includes("hospital")) {
    const sorted = [...gaps].sort((a, b) => {
      const aR = a.population > 0 ? (a.categories.healthcare / a.population) * 10000 : 99;
      const bR = b.population > 0 ? (b.categories.healthcare / b.population) * 10000 : 99;
      return aR - bR;
    });
    return `Worst healthcare access:\n\n${sorted.slice(0, 3)
      .map((g) => `• ${g.district} — ${g.categories.healthcare} facilities for ${g.population.toLocaleString()} people`)
      .join("\n")}`;
  }

  if (q.includes("recommend") || q.includes("priority") || q.includes("what should")) {
    return `Top priority interventions:\n\n${recommendations.slice(0, 5)
      .map((r) => `${r.rank}. ${r.district} — ${r.action} (gap: ${r.gapScore}, ${r.population.toLocaleString()} residents)`)
      .join("\n")}`;
  }

  if (q.includes("population") || q.includes("how many")) {
    const total = gaps.reduce((s, g) => s + g.population, 0);
    const underserved = gaps.filter((g) => g.gapScore > 50).reduce((s, g) => s + g.population, 0);
    return `Total: ${total.toLocaleString()} across ${gaps.length} districts.\nUnderserved (gap > 50): ${underserved.toLocaleString()} (${((underserved / total) * 100).toFixed(0)}%)`;
  }

  return `Try asking:\n• "Which districts are critical?"\n• "Tell me about Al Ghadeer"\n• "Where are schools most needed?"\n• "What are the top priorities?"`;
}

export default function AIChatPanel({ gaps, recommendations }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "I'm your Community Intelligence assistant. Ask about service gaps, district comparisons, or priority interventions." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    const answer = generateAnswer(input, gaps, recommendations);
    setMessages((prev) => [...prev, { role: "user", content: input }, { role: "assistant", content: answer }]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Sparkles size={14} className="text-cyan-400" />
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Community Intelligence</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-gray-300 border border-white/5"
              }`}
            >
              {m.content.split("\n").map((line, j) => (
                <p key={j} className={j > 0 ? "mt-1" : ""}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about service gaps..."
            className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3.5 py-2.5 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
