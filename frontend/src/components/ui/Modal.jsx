import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footerAction,
  size = 'md',
}) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-xl shadow-xl ${sizes[size]} w-full`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cloud-100">
            <h2 className="text-xl font-bold text-cloud-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-cloud-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">{children}</div>

          {/* Footer */}
          {footerAction && <div className="p-6 border-t border-cloud-100">{footerAction}</div>}
        </div>
      </div>
    </>
  );
}
