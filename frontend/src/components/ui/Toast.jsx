import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white',
  };

  return (
    <div className={`fixed bottom-4 right-4 ${colors[type]} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom z-50`}>
      {icons[type]}
      <span className="font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="ml-4 p-1 hover:bg-white/20 rounded transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
