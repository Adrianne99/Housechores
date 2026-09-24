import { X } from "lucide-react";
import { useRef } from "react";
import { Button } from "./buttons";

export const ModalShell = ({
  open,
  onClose,
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}) => {
  const ref = useRef(null);


  if (!open) return null;

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClass} mx-4 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Icon size={18} className="text-indigo-600" />
              </div>
            )}
            <div>
              <p className="text-base font-bold text-gray-900">{title}</p>
              {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          {footer}
        </div>
      </div>
    </div>
  );
};

// ─── Convenience footer for simple Cancel + Action modals ──────
export const SimpleFooter = ({
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Save",
  loading,
  confirmVariant = "primary",
}) => (
  <>
    <Button variant="secondary" size="md" className="w-full" onClick={onCancel}>
      {cancelLabel}
    </Button>
    <Button
      variant={confirmVariant}
      size="md"
      className="w-full"
      onClick={onConfirm}
      disabled={loading}
    >
      {loading ? "Saving..." : confirmLabel}
    </Button>
  </>
);
