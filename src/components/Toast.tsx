import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div
      id="toast-notify"
      className={`fixed bottom-6 right-6 z-[80] bg-[#101013] text-[#F5F2E4] px-5 py-3 rounded-none shadow-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center space-x-2 border border-white/20 ${
        message
          ? 'translate-y-0 opacity-100'
          : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <Check className="w-4 h-4 text-[#D9C4AB] flex-none" />
      <span id="toast-message">{message || ''}</span>
    </div>
  );
};
