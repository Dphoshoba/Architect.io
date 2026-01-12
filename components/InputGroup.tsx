
import React from 'react';

interface BaseProps {
  label: string;
  description?: string;
}

export const TextInput: React.FC<BaseProps & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, description, className, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic">{label}</label>}
    <input
      {...props}
      className={`w-full px-5 py-4 bg-[#11141d] border border-white/5 text-white placeholder:text-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-sm shadow-inner ${className || ''}`}
    />
  </div>
);

export const TextArea: React.FC<BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ label, description, className, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic">{label}</label>}
    <textarea
      {...props}
      className={`w-full px-5 py-4 bg-[#11141d] border border-white/5 text-white placeholder:text-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-sm resize-none shadow-inner min-h-[100px] ${className || ''}`}
    />
  </div>
);

export const Select: React.FC<BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>> = ({ label, children, className, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 italic">{label}</label>}
    <div className="relative">
      <select
        {...props}
        className={`w-full px-5 py-4 bg-[#11141d] border border-white/5 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-sm appearance-none cursor-pointer shadow-inner ${className || ''}`}
      >
        {children}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);
