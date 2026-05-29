/**
 * @file Toast.tsx
 * @description Toast notification UI component. Renders active notifications from useAppStore
 *              with a premium tech aesthetic, matching the dashboard's design.
 *
 * @features
 * - Subscribes to useAppStore toasts state
 * - Supports success, error, warning, and info notification types
 * - Displays matching modern Lucide icons and vibrant colored borders
 * - Includes a manual close button
 * - Absolute fixed container overlay at bottom-right of screen
 *
 * @dependencies lucide-react, useAppStore
 */

'use client';

import React from 'react';
import { X, CheckCircle2, AlertOctagon, Info, AlertTriangle } from 'lucide-react';
import { useAppStore, ToastMessage } from '../../stores/app-store';

const TYPE_STYLES = {
  success: {
    bg: 'bg-white',
    border: 'border-[#00E676]',
    text: 'text-[#0D0D0D]',
    iconColor: 'text-[#00E676]',
    icon: CheckCircle2,
  },
  error: {
    bg: 'bg-white',
    border: 'border-[#FF3D00]',
    text: 'text-[#0D0D0D]',
    iconColor: 'text-[#FF3D00]',
    icon: AlertOctagon,
  },
  warning: {
    bg: 'bg-white',
    border: 'border-[#FFEA00]',
    text: 'text-[#0D0D0D]',
    iconColor: 'text-[#FFEA00]',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-white',
    border: 'border-[#00E5FF]',
    text: 'text-[#0D0D0D]',
    iconColor: 'text-[#00E5FF]',
    icon: Info,
  },
};

/**
 * ToastItem component for rendering a single notification.
 */
const ToastItem = ({ toast }: { toast: ToastMessage }) => {
  const removeToast = useAppStore((state) => state.removeToast);
  const styles = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
  const Icon = styles.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 border-2 ${styles.border} ${styles.bg} shadow-[4px_4px_0px_0px_#0D0D0D] max-w-sm w-80 animate-in slide-in-from-right duration-200 pointer-events-auto`}
      role="alert"
    >
      <div className={`mt-0.5 shrink-0 ${styles.iconColor}`}>
        <Icon size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-syne text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">{toast.title}</h4>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-gray-600 break-words">{toast.message}</p>
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-gray-400 hover:text-[#0D0D0D] transition-colors"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

/**
 * ToastContainer component that aggregates all active toasts.
 */
export const ToastContainer = () => {
  const toasts = useAppStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
