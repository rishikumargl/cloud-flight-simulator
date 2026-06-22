import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function BriefingSection({
  title = 'Mission Briefing',
  objectives = [],
  businessContext = '',
  successCriteria = [],
  resources = [],
  className = '',
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Business Context */}
      {businessContext && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-sky-900 mb-3 flex items-center gap-2">
            <span className="text-lg">🎯</span>
            Business Context
          </h3>
          <p className="text-sm text-sky-800 leading-relaxed">
            {businessContext}
          </p>
        </div>
      )}

      {/* Objectives */}
      {objectives && objectives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cloud-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span>
            Objectives
          </h3>
          <div className="space-y-3">
            {objectives.map((objective, idx) => (
              <div
                key={idx}
                className="flex gap-3 p-4 rounded-xl bg-cloud-50 border border-cloud-200 hover:border-cloud-300 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-sm font-semibold">
                    {idx + 1}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-cloud-900">{objective.title}</p>
                  {objective.description && (
                    <p className="text-xs text-cloud-600 mt-1">{objective.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Criteria */}
      {successCriteria && successCriteria.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cloud-900 mb-4 flex items-center gap-2">
            <span className="text-lg">✅</span>
            Success Criteria
          </h3>
          <div className="space-y-2">
            {successCriteria.map((criteria, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-accent-50 border border-accent-200"
              >
                <CheckCircle2 className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-cloud-700">{criteria}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cloud Resources */}
      {resources && resources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cloud-900 mb-4 flex items-center gap-2">
            <span className="text-lg">☁️</span>
            Cloud Resources
          </h3>
          <div className="grid gap-3">
            {resources.map((resource, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-sky-50 border border-primary-200"
              >
                <div className="text-xl mt-1">{resource.icon || '🔧'}</div>
                <div>
                  <p className="text-sm font-semibold text-cloud-900">{resource.name}</p>
                  {resource.description && (
                    <p className="text-xs text-cloud-600 mt-1">{resource.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
