export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-card p-6 border border-cloud-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
