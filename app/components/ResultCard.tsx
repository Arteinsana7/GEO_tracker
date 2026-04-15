import { Result} from "../types/audit";

interface props {
    result : Result;
}

export default function ResultCard ({result} : props) {
   const { analysis, query } = result;

   const citationBadge = () => {
    if (!analysis.cited) return { label: "Non citée", cls: "bg-red-50 text-red-600" };
    if (analysis.citation_type === "primary") return { label: "1re position", cls: "bg-emerald-50 text-emerald-700" };
    return { label: "2nde position", cls: "bg-amber-50 text-amber-700" };
  };

  const sentimentColor = () => {
    if (analysis.sentiment === "positive") return "bg-emerald-50 text-emerald-600";
    if (analysis.sentiment === "negative") return "bg-red-50 text-red-600";
    return "bg-gray-100 text-gray-500";
  };
 const badge = citationBadge();

 return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      
      {/* Question + badge citation */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-800 flex-1">{query}</p>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Sentiment */}
      {analysis.cited && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sentimentColor()}`}>
            {analysis.sentiment}
          </span>
          {analysis.sentiment_reason && (
            <span className="text-xs text-gray-400">{analysis.sentiment_reason}</span>
          )}
        </div>
      )}

      {/* Concurrents cités */}
      {analysis.competitors_cited.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Concurrents cités :</span>
          {analysis.competitors_cited.map((c) => (
            <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Recommandation GEO */}
      <p className="text-xs text-violet-600 bg-violet-50 px-3 py-2 rounded-lg">
        {analysis.geo_opportunity}
      </p>

    </div>
  );
}