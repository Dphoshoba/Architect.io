
import React, { useState } from 'react';
import { 
  PromptInput, 
  PromptOutput, 
  MastermindSuggestionCategory, 
  InterviewQuestion,
  ProjectCategory,
  CategoryConfig
} from './types.ts';
import { TextArea, Select, TextInput } from './components/InputGroup.tsx';
import { 
  generateArchitectPrompt, 
  generateVisualImage, 
  generateMastermindSuggestions,
  generateInterviewQuestions
} from './services/geminiService.ts';

const CategoryIcon = ({ type }: { type: ProjectCategory }) => {
  const base = "w-16 h-16 text-[#0055FF] mb-6 transition-transform group-hover:scale-110";
  switch (type) {
    case 'ENGINEERING':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
        </svg>
      );
    case 'REAL_ESTATE':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'INTERIOR_DESIGN':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          <path d="M5.5 14a2 2 0 010-4M18.5 14a2 2 0 000-4M12 21a2 2 0 110-4M12 7a2 2 0 100-4" />
        </svg>
      );
    case 'ART_CREATIVE':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
        </svg>
      );
    case 'VISUAL_ASSET':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case 'WEB_DEVELOPMENT':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );
    case 'BUSINESS_WEB':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <rect x="14" y="14" width="8" height="6" rx="2" />
        </svg>
      );
    default:
      return null;
  }
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [step, setStep] = useState<'INITIAL' | 'CONFIG' | 'DISCOVERY' | 'MATRIX' | 'FINAL'>('INITIAL');
  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", 
    high_level_goal: "", 
    task_type: "Synthesis", 
    domain_context: "",
    user_persona: "Lead Architect", 
    tone_style: "Professional", 
    output_format: "Markdown",
    length_and_depth: "Detailed", 
    reasoning_visibility: "detailed", 
    language: "English",
    visual_inspiration_mode: true,
    category: "GENERIC",
    config: {}
  });
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [mastermindSuggestions, setMastermindSuggestions] = useState<MastermindSuggestionCategory[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    const fallbackCopy = (val: string) => {
      const el = document.createElement('textarea');
      el.value = val;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        alert("Prompt copied to clipboard!");
      } catch (e) {
        alert("Copy failed. Please manually select the text.");
      }
      document.body.removeChild(el);
    };

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        alert("Prompt copied to clipboard!");
      } catch (e) { fallbackCopy(text); }
    } else { fallbackCopy(text); }
  };

  const startDiscovery = async () => {
    if (!form.high_level_goal) return alert("High Level Goal required.");
    setLoading(true);
    setError(null);
    try {
      const res = await generateInterviewQuestions(form);
      setInterviewQuestions(res);
      setStep('DISCOVERY');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const startMatrix = async () => {
    setLoading(true);
    setError(null);
    try {
      const enrichedForm = { ...form, discovery: interviewAnswers };
      const res = await generateMastermindSuggestions(enrichedForm);
      setMastermindSuggestions(res);
      const initial: Record<string, string> = {};
      res.forEach(cat => { initial[cat.category] = cat.options[0].technical_value; });
      setSelectedSuggestions(initial);
      setStep('MATRIX');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const synthesizeFinal = async () => {
    setLoading(true);
    setError(null);
    try {
      const enrichedInput = { ...form, matrix_selections: selectedSuggestions, context: interviewAnswers };
      const res = await generateArchitectPrompt(enrichedInput);
      setOutput(res);
      if (form.visual_inspiration_mode) {
        try {
          const img = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || form.high_level_goal);
          setGeneratedVisual(img);
        } catch (e) { console.warn("Reference visual failed."); }
      }
      setStep('FINAL');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const categories = [
    { id: 'ENGINEERING' as ProjectCategory, title: 'ENGINEERING', desc: 'Mechanical systems and industrial tools.' },
    { id: 'REAL_ESTATE' as ProjectCategory, title: 'REAL ESTATE', desc: 'Property listings and spatial narratives.' },
    { id: 'BUSINESS_WEB' as ProjectCategory, title: 'BUSINESS WEB', desc: 'Conversion portals and SaaS landing pages.' },
    { id: 'WEB_DEVELOPMENT' as ProjectCategory, title: 'WEB DEVELOPMENT', desc: 'Full-stack architectures and UI systems.' },
    { id: 'INTERIOR_DESIGN' as ProjectCategory, title: 'INTERIOR DESIGN', desc: 'Material boards and spatial concepts.' },
    { id: 'ART_CREATIVE' as ProjectCategory, title: 'ART & CREATIVE', desc: 'Narrative storytelling and character lore.' },
    { id: 'VISUAL_ASSET' as ProjectCategory, title: 'VISUAL ASSET', desc: 'Cinematic lighting and 8k renders.' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
      <header className="h-24 px-12 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-50 border-b border-white/20">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setStep('INITIAL'); setError(null); }}>
          <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl shadow-lg">B</div>
          <h1 className="text-xl font-black uppercase tracking-tight">Architect<span className="text-[#0055FF]">.Quantum</span></h1>
        </div>
        <nav className="hidden md:flex items-center gap-10">
          <div className={`nav-link ${step !== 'INITIAL' ? 'active' : 'text-gray-400'}`} onClick={() => setStep('INITIAL')}>Synthesis</div>
          <div className="nav-link text-gray-400">Vault</div>
        </nav>
        <button className="btn-enterprise">Enterprise Access</button>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-12 py-12 flex-1">
        {loading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#0055FF]/10 border-t-[#0055FF] rounded-full animate-spin mb-8 shadow-2xl" />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 italic">Neural Synthesis Active...</span>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-12 p-8 bg-red-50 border-2 border-red-100 rounded-[32px] text-red-600 animate-fade-in">
            <h3 className="text-xl font-black mb-2 uppercase italic tracking-tight">Interrupted.</h3>
            <p className="font-medium text-red-500/80 mb-6">{error}</p>
            <button onClick={() => setError(null)} className="px-8 py-3 bg-red-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors">Dismiss</button>
          </div>
        )}

        {step === 'INITIAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in pt-8">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { setForm(f => ({ ...f, category: cat.id })); setStep('CONFIG'); }} className="mobbin-card p-12 flex flex-col items-center text-center group bg-white shadow-sm hover:border-[#0055FF]/20">
                <CategoryIcon type={cat.id} />
                <h3 className="text-2xl font-black uppercase mb-4 group-hover:text-[#0055FF] transition-colors">{cat.title}</h3>
                <p className="text-gray-500 italic font-medium leading-relaxed max-w-[240px]">{cat.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 'CONFIG' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in py-12">
            <h2 className="text-[12vw] md:text-[8vw] font-black italic uppercase tracking-tighter leading-[0.85] text-center mb-16">Architecture.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <TextArea label="HIGH LEVEL GOAL" placeholder="Vision description..." value={form.high_level_goal} onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} className="text-lg py-8 min-h-[200px] rounded-[40px] px-10 border-slate-100 bg-slate-50/30" />
              </div>
              {form.category === 'BUSINESS_WEB' && (
                <>
                  <Select label="Site Type" value={form.config?.siteType} onChange={e => setForm(f => ({...f, config: {...f.config, siteType: e.target.value}}))}>
                    <option value="">Select Type...</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Corporate">Corporate Portal</option>
                    <option value="E-commerce">Storefront</option>
                  </Select>
                  <Select label="Conversion" value={form.config?.conversionGoal} onChange={e => setForm(f => ({...f, config: {...f.config, conversionGoal: e.target.value}}))}>
                    <option value="">Select Goal...</option>
                    <option value="Leads">Lead Gen</option>
                    <option value="Sales">Direct Sales</option>
                  </Select>
                </>
              )}
            </div>
            <button onClick={startDiscovery} className="mobbin-btn-primary w-full py-8 text-xl">Continue Discovery</button>
          </div>
        )}

        {step === 'DISCOVERY' && (
          <div className="animate-fade-in space-y-12 max-w-4xl mx-auto py-8">
            <div className="space-y-16">
              {interviewQuestions.map(q => (
                <div key={q.id} className="mobbin-card p-12 space-y-8 flex flex-col items-center text-center">
                  <div className="space-y-4 max-w-2xl">
                    <h4 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-[1.1]">{q.question}</h4>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0055FF]">{q.context}</p>
                  </div>
                  <TextArea placeholder="Depth for precision..." value={interviewAnswers[q.id] || ""} onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))} className="bg-slate-50/50 border-none rounded-[32px] min-h-[140px] text-center px-12" />
                </div>
              ))}
            </div>
            <button onClick={startMatrix} className="mobbin-btn-primary w-full py-8 text-xl shadow-xl">Synthesize Matrix</button>
          </div>
        )}

        {step === 'MATRIX' && (
          <div className="animate-fade-in space-y-12">
            <h2 className="text-7xl font-black italic uppercase tracking-tighter mb-12">Strategy Matrix.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mastermindSuggestions.map(cat => (
                <div key={cat.category} className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic ml-4">{cat.category}</h4>
                  <div className="space-y-6">
                    {cat.options.map(opt => (
                      <button key={opt.label} onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} className={selectedSuggestions[cat.category] === opt.technical_value ? 'matrix-card-black scale-[1.02]' : 'matrix-card-white'}>
                        <h5 className="text-2xl font-black uppercase mb-4 leading-tight">{opt.label}</h5>
                        <p className={`text-sm font-bold uppercase italic leading-relaxed ${selectedSuggestions[cat.category] === opt.technical_value ? 'opacity-80' : 'text-gray-400'}`}>{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={synthesizeFinal} className="mobbin-btn-primary w-full py-10 text-2xl mt-12 shadow-2xl">Finalize Release</button>
          </div>
        )}

        {step === 'FINAL' && output && (
          <div className="animate-fade-in space-y-16 py-8">
            <div className="flex justify-between items-end border-b-8 border-black pb-8">
              <h2 className="text-[10vw] font-black italic uppercase tracking-tighter leading-none">Release.</h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Production Prompt</h4>
                    <button onClick={() => copyToClipboard(output.FINAL_PROMPT)} className="text-[10px] font-black uppercase text-slate-400 hover:text-black transition-colors">Copy to clipboard</button>
                  </div>
                  <div className="mobbin-card p-12 bg-black text-white/90 font-mono text-sm leading-relaxed custom-scrollbar max-h-[700px] overflow-y-auto select-all shadow-3xl border-none">
                    {output.FINAL_PROMPT}
                  </div>
                </div>
                {generatedVisual && <img src={generatedVisual} className="w-full rounded-[60px] shadow-3xl border-8 border-white aspect-video object-cover" alt="Output Reference" />}
              </div>
              <div className="space-y-16">
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Changelog / Neural Commit</h4>
                  <div className="mobbin-card p-8 border-none bg-slate-100/50 font-mono text-xs text-slate-600 leading-relaxed italic">
                    {output.COMMIT_MESSAGE}
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Structural Blueprint</h4>
                  <div className="mobbin-card p-10 text-2xl italic font-black leading-tight text-slate-800 border-l-[16px] border-[#0055FF]">{output.APP_BLUEPRINT}</div>
                </div>
                <div className="space-y-8">
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Applied Logic Stacks</h4>
                  <div className="space-y-6">
                    {output.APPLIED_STRATEGIES.map(s => (
                      <div key={s.name} className="mobbin-card p-8 border-none bg-white shadow-sm">
                        <h5 className="text-lg font-black uppercase mb-1 italic tracking-tight">{s.name}</h5>
                        <p className="text-sm text-slate-400 italic font-bold">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setStep('INITIAL')} className="mobbin-btn-primary w-full py-10 text-xl">New Project Initiation</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
