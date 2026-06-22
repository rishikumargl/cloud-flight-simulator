import { Clock, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import Button from './Button';

export default function MissionCard({
  icon = '🚀',
  title = 'Mission',
  description = '',
  difficulty = 'intermediate',
  estimatedTime = '60 min',
  status = 'available', // available, in-progress, completed
  onClick,
  className = '',
  skills = [],
  tags = [],
}) {
  const difficultyColors = {
    beginner: 'bg-green-50 border-green-200 text-green-700',
    intermediate: 'bg-amber-50 border-amber-200 text-amber-700',
    advanced: 'bg-red-50 border-red-200 text-red-700',
  };

  const statusColors = {
    available: 'border-cloud-200 hover:border-cloud-300 hover:shadow-card-hover',
    'in-progress': 'border-primary-200 bg-primary-50',
    completed: 'border-accent-200 bg-accent-50',
  };

  const statusIcons = {
    available: null,
    'in-progress': <Zap className="w-5 h-5 text-primary-600" />,
    completed: <CheckCircle2 className="w-5 h-5 text-accent-600" />,
  };

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left bg-white rounded-2xl border-2 p-6 transition-all duration-300 ${statusColors[status]} ${className}`}
    >
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        {statusIcons[status]}
      </div>

      {/* Icon & Title Section */}
      <div className="mb-4">
        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-lg font-bold text-cloud-900 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-cloud-600 mb-4 line-clamp-2">
          {description}
        </p>
      )}

      {/* Skills Tags */}
      {skills && skills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {skills.slice(0, 2).map((skill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-cloud-100 text-cloud-700"
            >
              {skill}
            </span>
          ))}
          {skills.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 text-xs text-cloud-600">
              +{skills.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Meta Information */}
      <div className="flex items-center gap-4 mb-4 pt-4 border-t border-cloud-100">
        {/* Difficulty Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-semibold ${difficultyColors[difficulty]}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </div>

        {/* Time Estimate */}
        <div className="flex items-center gap-1 text-sm text-cloud-600">
          <Clock className="w-4 h-4" />
          <span>{estimatedTime}</span>
        </div>
      </div>

      {/* CTA Button */}
      {status === 'available' && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700">
            {status === 'completed' ? 'Review' : 'Start Mission'}
          </span>
          <ArrowRight className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
      {status === 'in-progress' && (
        <div className="flex items-center gap-2 text-sm font-semibold text-primary-600">
          <span className="animate-pulse">In Progress</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
      {status === 'completed' && (
        <div className="flex items-center gap-2 text-sm font-semibold text-accent-600">
          <span>✓ Completed</span>
        </div>
      )}
    </button>
  );
}
