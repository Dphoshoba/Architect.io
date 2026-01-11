
import React from 'react';

interface BaseProps {
  label: string;
  description?: string;
}

export const TextInput: React.FC<BaseProps & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, description, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-black text-slate-300 uppercase tracking-[0.15em] ml-1 italic">{label}</label>
    {description && <p className="text-[10px] text-slate-500 mb-0.5 ml-1">{description}</p>}
    <input
      {...props}
      className="w-full px-4 py-3 bg-[#161920] border border-white/5 text-white placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-inner"
    />
  </div>
);

export const TextArea: React.FC<BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ label, description, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-black text-slate-300 uppercase tracking-[0.15em] ml-1 italic">{label}</label>
    {description && <p className="text-[10px] text-slate-500 mb-0.5 ml-1">{description}</p>}
    <textarea
      {...props}
      rows={props.rows || 3}
      className="w-full px-4 py-3 bg-[#161920] border border-white/5 text-white placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none shadow-inner min-h-[80px]"
    />
  </div>
);

export const Select: React.FC<BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>> = ({ label, description, children, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-black text-slate-300 uppercase tracking-[0.15em] ml-1 italic">{label}</label>
    {description && <p className="text-[10px] text-slate-500 mb-0.5 ml-1">{description}</p>}
    <div className="relative">
      <select
        {...props}
        className="w-full px-4 py-3 bg-[#161920] border border-white/5 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer shadow-inner"
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);
