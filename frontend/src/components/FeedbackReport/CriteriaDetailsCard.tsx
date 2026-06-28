import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Criterion {
  criterion_id: string;
  passed: boolean;
  details: string;
  weight: number;
}

interface CriteriaDetailsCardProps {
  passed: Criterion[];
  failed: Criterion[];
}

export function CriteriaDetailsCard({ passed, failed }: CriteriaDetailsCardProps) {
  const allCriteria = [...passed, ...failed];
  if (allCriteria.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="mono-label text-primary">SUCCESS CRITERIA EVALUATION</h2>

      <div className="space-y-4">
        {/* Passed criteria */}
        {passed.length > 0 && (
          <div className="space-y-3">
            {passed.map((criterion) => (
              <div
                key={criterion.criterion_id}
                className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-green-900 text-[14px]">
                      Criterion {criterion.criterion_id}
                    </p>
                    <span className="text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded whitespace-nowrap">
                      {criterion.weight}% weight
                    </span>
                  </div>
                  <p className="text-[13px] text-green-800">{criterion.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Failed criteria */}
        {failed.length > 0 && (
          <div className="space-y-3">
            {failed.map((criterion) => (
              <div
                key={criterion.criterion_id}
                className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-red-900 text-[14px]">
                      Criterion {criterion.criterion_id}
                    </p>
                    <span className="text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded whitespace-nowrap">
                      {criterion.weight}% weight
                    </span>
                  </div>
                  <p className="text-[13px] text-red-800">{criterion.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
