export default function ProgressBar({ progress = 0, label = '', size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium mb-2 text-cloud-700">{label}</p>}
      <div className={`w-full bg-cloud-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 flex items-center justify-center`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {progress > 10 && <span className="text-xs font-bold text-white">{progress}%</span>}
        </div>
      </div>
    </div>
  );
}
