export default function Badge({ children, variant = 'info', className = '', ...props }) {
  const variants = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-cloud-100 text-cloud-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
