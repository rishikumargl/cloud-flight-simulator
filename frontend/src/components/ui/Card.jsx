export default function Card({ children, className = '', hoverable = true, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-cloud-100 p-6 transition-all duration-300 ${
        hoverable ? 'hover:shadow-card-hover hover:border-cloud-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
