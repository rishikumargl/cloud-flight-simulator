export default function Badge({ children, variant = 'info', size = 'md', className = '', ...props }) {
  const variants = {
    success: 'bg-accent-100 text-accent-700 border border-accent-200',
    warning: 'bg-warning/10 text-warning border border-warning/30',
    error: 'bg-error/10 text-error border border-error/30',
    info: 'bg-info/10 text-info border border-info/30',
    primary: 'bg-primary-100 text-primary-700 border border-primary-200',
    secondary: 'bg-cloud-100 text-cloud-700 border border-cloud-200',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${variants[variant]} ${sizes[size]} transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
