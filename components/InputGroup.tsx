import React from 'react';

interface BaseProps {
  label?: string;
  description?: string;
}

export const TextInput: React.FC<BaseProps & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, description, className, ...props }) => (
  <div className="flex flex-col gap-2.5 w-full">
    {label && <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2 italic">{label}</label>}
    <input
      {...props}
      style={{ color: '#141414', backgroundColor: '#FFFFFF' }}
      className={`w-full px-7 py-5 border border-black/5 rounded-[24px] focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all text-[15px] font-medium shadow-sm placeholder:text-slate-300 ${className || ''}`}
    />
  </div>
);

export const TextArea: React.FC<BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ label, description, className, ...props }) => (
  <div className="flex flex-col gap-2.5 w-full">
    {label && <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2 italic">{label}</label>}
    <textarea
      {...props}
      style={{ color: '#141414', backgroundColor: '#FFFFFF' }}
      className={`w-full px-7 py-6 border border-black/5 rounded-[28px] focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all text-[15px] font-medium resize-none shadow-sm min-h-[120px] placeholder:text-slate-300 leading-relaxed ${className || ''}`}
    />
  </div>
);

export const Select: React.FC<BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>> = ({ label, children, className, ...props }) => (
  <div className="flex flex-col gap-2.5 w-full">
    {label && <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2 italic">{label}</label>}
    <div className="relative">
      <select
        {...props}
        style={{ color: '#141414', backgroundColor: '#FFFFFF' }}
        className={`w-full px-7 py-5 border border-black/5 rounded-[24px] focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all text-[15px] font-medium appearance-none cursor-pointer shadow-sm ${className || ''}`}
      >
        {children}
      </select>
      <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);