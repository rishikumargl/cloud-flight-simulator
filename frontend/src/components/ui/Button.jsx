export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-gradient-to-br from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg active:shadow-sm focus:ring-primary-500',
    secondary: 'bg-cloud-100 text-cloud-900 hover:bg-cloud-200 active:bg-cloud-300 shadow-sm hover:shadow-md focus:ring-cloud-400',
    success: 'bg-gradient-to-br from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 shadow-md hover:shadow-lg focus:ring-accent-500',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-400',
    danger: 'bg-gradient-to-br from-error to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg focus:ring-red-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
