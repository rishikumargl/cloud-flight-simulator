export default function ProgressBar({ progress = 0, label = '', size = 'md', className = '', variant = 'primary' }) {
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const variants = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-accent-500 to-accent-600',
    warning: 'from-warning to-orange-600',
    error: 'from-error to-red-600',
  };

  return (
    <div className={className}>
      {label && <p className="text-sm font-semibold mb-2 text-cloud-700">{label}</p>}
      <div className={`w-full bg-cloud-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${variants[variant]} transition-all duration-500 ease-out flex items-center justify-center`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {progress > 10 && <span className="text-xs font-bold text-white">{progress}%</span>}
        </div>
      </div>
    </div>
  );
}
