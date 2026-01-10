
import React from 'react';

interface BaseProps {
  label: string;
  description?: string;
}

export const TextInput: React.FC<BaseProps & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, description, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-700 uppercase tracking-tight ml-1">{label}</label>
    {description && <p className="text-[10px] text-slate-500 mb-0.5 ml-1">{description}</p>}
    <input
      {...props}
      className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
    />
  </div>
);

export const TextArea: React.FC<BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ label, description, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-700 uppercase tracking-tight ml-1">{label}</label>
    {description && <p className="text-[10px] text-slate-500 mb-0.5 ml-1">{description}</p>}
    <textarea
      {...props}
      rows={props.rows || 3}
      className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none shadow-sm min-h-[80px]"
    />
  </div>
);

export const Select: React.FC<BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>> = ({ label, description, children, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-700 uppercase tracking-tight ml-1">{label}</label>
    {description && <p className="text-[10px] text-slate-500 mb-0.5 ml-1">{description}</p>}
    <div className="relative">
      <select
        {...props}
        className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none shadow-sm cursor-pointer"
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);
