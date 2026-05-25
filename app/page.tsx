"use client";

import { useState } from "react";
import AuditForm from "./components/AuditForm";
import ResultCard from "./components/ResultCard";
import { runAudit } from "./services/auditService";
import { AuditConfig, DonePayload, Result } from "./types/audit";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [done, setDone] = useState<DonePayload | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [brand, setBrand] = useState("");

  async function handleSubmit(config: AuditConfig) {
    setLoading(true);
    setResults([]);
    setDone(null);
    setProgress(0);
    setTotal(config.queries.length);
    setBrand(config.brand);

    await runAudit(
      config,
      (result, index, total) => {
        setResults((prev) => [...prev, result]);
        setProgress(index + 1);
        setTotal(total);
      },
      (payload) => {
        setDone(payload);
        setLoading(false);
      },
      (index, query) => {
        console.error(`Erreur sur la requête ${index} : ${query}`);
        if (index === config.queries.length - 1) {
          setLoading(false);
        }
      }
    );
  }
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="no-print">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">GEO Tracker</h1>
          <p className="text-gray-400 text-sm">
            Audite la présence d'une marque dans les LLM — score, sentiment, concurrents.
          </p>
        </div>

        {/* Formulaire — caché à l'impression */}
        <div className="no-print">
          <AuditForm
            onSubmit={handleSubmit}
            loading={loading}
            progress={progress}
            total={total}
          />
        </div>

        {/* Résultats en temps réel */}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        )}

        {/* Score final */}
        {done && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Résultats — {brand}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-semibold text-violet-600">{done.geoScore}</p>
                <p className="text-xs text-gray-400 mt-1">Score GEO / 100</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-semibold text-gray-800">{done.citationRate}%</p>
                <p className="text-xs text-gray-400 mt-1">Taux de citation</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-semibold text-gray-800">{done.cited}/{done.total}</p>
                <p className="text-xs text-gray-400 mt-1">Requêtes citées</p>
              </div>
            </div>

            {/* Bouton impression — caché à l'impression */}
            <button
              onClick={() => window.print()}
              className="no-print w-full border border-violet-300 text-violet-600 hover:bg-violet-50 font-medium py-3 px-6 rounded-lg text-sm transition-colors"
            >
              Télécharger le rapport (PDF)
            </button>
          </div>
        )}

      </div>
    </main>
  )}