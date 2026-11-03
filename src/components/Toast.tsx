import React from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  type?: 'success' | 'info' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, visible, type = 'success' }) => {
  return (
    <div
      className={`fixed bottom-12 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-3 transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      } ${
        type === 'error'
          ? 'bg-red-600 text-white border-red-400'
          : type === 'info'
          ? 'bg-amber-600 text-white border-amber-400'
          : 'bg-sky-600 text-white border-sky-400'
      }`}
    >
      <i
        className={`fa-solid text-lg ${
          type === 'error'
            ? 'fa-triangle-exclamation'
            : type === 'info'
            ? 'fa-circle-info'
            : 'fa-circle-check'
        }`}
      ></i>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
