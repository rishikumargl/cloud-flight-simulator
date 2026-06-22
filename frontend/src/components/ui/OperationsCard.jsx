import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function OperationsCard({
  title = '',
  value = '0',
  label = '',
  trend = null, // { direction: 'up' | 'down', percent: number }
  icon = '📊',
  status = 'normal', // normal, warning, critical
  subtitle = '',
  className = '',
  onClick,
}) {
  const statusColors = {
    normal: 'border-cloud-200 bg-white hover:border-cloud-300',
    warning: 'border-amber-200 bg-amber-50 hover:border-amber-300',
    critical: 'border-error/30 bg-error/10 hover:border-error/40',
  };

  const statusTextColors = {
    normal: 'text-cloud-900',
    warning: 'text-amber-900',
    critical: 'text-error',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 group ${statusColors[status]} ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className={`text-xs font-bold uppercase tracking-wide text-cloud-500 mb-2`}>{label}</p>
          <p className={`text-3xl font-bold ${statusTextColors[status]} group-hover:translate-x-0.5 transition-transform`}>
            {value}
          </p>
        </div>
        <div className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
      </div>

      {subtitle && (
        <p className={`text-sm ${status === 'critical' ? 'text-error' : 'text-cloud-600'}`}>
          {subtitle}
        </p>
      )}

      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-sm font-semibold ${
          trend.direction === 'up' ? 'text-accent-600' : 'text-error'
        }`}>
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {trend.direction === 'up' ? '+' : '-'}{trend.percent}%
        </div>
      )}
    </button>
  );
}
