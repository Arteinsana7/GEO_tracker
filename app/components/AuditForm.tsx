import { useState } from "react";
import { AuditConfig } from "../types/audit";

interface Props {
  onSubmit: (config: AuditConfig) => void;
  loading: boolean;
  progress: number;
  total: number;
}

export default function AuditForm({ onSubmit, loading, progress, total }: Props) {
  const [generating, setGenerating] = useState(false);
  const [queries, setQueries] = useState("");
  const [brand, setBrand] = useState("");
  const [sector, setSector] = useState("");
  const [competitors, setCompetitors] = useState("");

  async function handleGenerateQueries() {
    if (!brand || !sector) return;
    setGenerating(true);

    const res = await fetch("/api/generate-queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand,
        sector,
        competitors: competitors.split(",").map((c) => c.trim()).filter(Boolean),
      }),
    });

    const data = await res.json();
    const lines = data.queries.map((q: { angle: string; query: string }) =>
      `[${q.angle}] ${q.query}`
    ).join("\n");

    setQueries(lines);
    setGenerating(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;

    const config: AuditConfig = {
      brand,
      sector,
      competitors: competitors.split(",").map((c) => c.trim()).filter(Boolean),
      queries: queries
        .split("\n")
        .map((q) => q.replace(/^\[.*?\]\s*/, "").trim())
        .filter(Boolean),
    };

    onSubmit(config);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-5">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="ex : Sephora"
          required
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
        <input
          type="text"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="ex : beauté / cosmétique"
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Concurrents <span className="text-gray-400 font-normal">(séparés par des virgules)</span>
        </label>
        <input
          type="text"
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          placeholder="ex : Marionnaud, Nocibé, Yves Rocher"
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Requêtes <span className="text-gray-400 font-normal">(une par ligne)</span>
          </label>
          <button
            type="button"
            onClick={handleGenerateQueries}
            disabled={generating || !brand || !sector}
            className="text-xs text-violet-600 hover:text-violet-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {generating ? "Génération..." : "Générer automatiquement ↗"}
          </button>
        </div>
        <textarea
          rows={8}
          value={queries}
          onChange={(e) => setQueries(e.target.value)}
          placeholder={"Quelle marque de beauté recommandes-tu ?\nMeilleur programme de fidélité beauté ?\nMarque engagée pour le développement durable ?"}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
        {queries && (
          <p className="text-xs text-gray-400 mt-1">
            {queries.split("\n").filter(Boolean).length} requêtes · Tu peux les modifier avant de lancer
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !brand || !queries}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg text-sm transition-colors"
      >
        {loading ? `Analyse en cours... (${progress}/${total})` : "Lancer l'audit GEO"}
      </button>

    </form>
  );
}