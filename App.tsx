
import React, { useState } from 'react';
import { 
  PromptInput, 
  PromptOutput, 
  MastermindSuggestionCategory, 
  InterviewQuestion,
  ProjectCategory
} from './types.ts';
import { TextArea } from './components/InputGroup.tsx';
import { 
  generateArchitectPrompt, 
  generateVisualImage, 
  refineVisualImage,
  generateMastermindSuggestions,
  generateInterviewQuestions
} from './services/geminiService.ts';

type Step = 'INITIAL' | 'CONFIG' | 'DISCOVERY' | 'MATRIX' | 'FINAL';

const CategoryIcon = ({ type }: { type: ProjectCategory }) => {
  const base = "w-16 h-16 text-[#0055FF] mb-6 transition-transform group-hover:scale-110";
  switch (type) {
    case 'ENGINEERING':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2" /></svg>;
    case 'REAL_ESTATE':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case 'BUSINESS_WEB':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><rect x="14" y="14" width="8" height="6" rx="2" /></svg>;
    case 'WEB_DEVELOPMENT':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="14" y1="4" x2="10" y2="20" /></svg>;
    case 'INTERIOR_DESIGN':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /><path d="M12 21a2 2 0 110-4M12 7a2 2 0 100-4" /></svg>;
    case 'ART_CREATIVE':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z" /><circle cx="11" cy="11" r="2" /></svg>;
    case 'VISUAL_ASSET':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
    default: return null;
  }
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [step, setStep] = useState<Step>('INITIAL');
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  
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
  const [refinementPrompt, setRefinementPrompt] = useState("");

  const navigateTo = (next: Step) => {
    setStepHistory(prev => [...prev, step]);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (stepHistory.length === 0) return;
    const prev = stepHistory[stepHistory.length - 1];
    setStepHistory(prevHistory => prevHistory.slice(0, -1));
    setStep(prev);
  };

  const copyToClipboard = async (text: string, label: string = "Content") => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (e) { alert("Copy failed."); }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAppendOption = (questionId: string, fullOption: string) => {
    setInterviewAnswers(prev => {
      const current = (prev[questionId] || "").trim();
      const separator = current ? (current.endsWith('.') || current.endsWith('?') ? ' ' : ', ') : '';
      return { ...prev, [questionId]: current + separator + fullOption };
    });
  };

  const parseOption = (opt: string) => {
    const match = opt.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) return { technical: match[1], simple: match[2] };
    return { technical: opt, simple: null };
  };

  const startDiscovery = async () => {
    if (!form.high_level_goal) return alert("High Level Goal required.");
    setLoading(true); setError(null);
    try {
      const res = await generateInterviewQuestions(form);
      setInterviewQuestions(res);
      navigateTo('DISCOVERY');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const startMatrix = async () => {
    setLoading(true); setError(null);
    try {
      const res = await generateMastermindSuggestions(form);
      setMastermindSuggestions(res);
      const initial: Record<string, string> = {};
      res.forEach(cat => { initial[cat.category] = cat.options[0].technical_value; });
      setSelectedSuggestions(initial);
      navigateTo('MATRIX');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const synthesizeFinal = async () => {
    setLoading(true); setError(null);
    try {
      const enrichedInput = { ...form, matrix_selections: selectedSuggestions, context: interviewAnswers };
      const res = await generateArchitectPrompt(enrichedInput);
      setOutput(res);
      if (form.visual_inspiration_mode) {
        try {
          const img = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || form.high_level_goal);
          setGeneratedVisual(img);
        } catch (e) { console.warn("Visual generation failed."); }
      }
      navigateTo('FINAL');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleImageRefinement = async () => {
    if (!refinementPrompt || !generatedVisual) return;
    setLoading(true);
    try {
      const newImg = await refineVisualImage(generatedVisual, refinementPrompt);
      if (newImg) {
        setGeneratedVisual(newImg);
        setRefinementPrompt("");
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const renderBackBtn = () => (
    <button onClick={goBack} className="fixed top-28 left-8 z-40 group flex items-center gap-2 px-6 py-3 bg-white/50 backdrop-blur-md border border-black/5 rounded-full shadow-sm hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
      <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
      Back
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] relative">
      <header className="h-24 px-12 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-50 border-b border-white/20">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setStep('INITIAL'); setStepHistory([]); }}>
          <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl shadow-lg">B</div>
          <h1 className="text-xl font-black uppercase tracking-tight">Architect<span className="text-[#0055FF]">.Quantum</span></h1>
        </div>
        <button className="btn-enterprise">Enterprise Access</button>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-12 py-12 flex-1 relative">
        {loading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#0055FF]/10 border-t-[#0055FF] rounded-full animate-spin mb-8" />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 italic animate-pulse">Neural Synthesis Active...</span>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-12 p-8 bg-red-50 border-2 border-red-100 rounded-[32px] text-red-600 animate-fade-in relative">
            <button onClick={() => setError(null)} className="absolute top-4 right-4 text-red-300 hover:text-red-600 transition-colors">✕</button>
            <h3 className="text-xl font-black mb-2 uppercase italic tracking-tight">Synthesis Interrupted.</h3>
            <p className="font-medium mb-6 opacity-70">{error}</p>
          </div>
        )}

        {step !== 'INITIAL' && renderBackBtn()}

        {step === 'INITIAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in pt-8">
            {[
              { id: 'ENGINEERING', title: 'ENGINEERING', desc: 'Precision industrial systems and logic.' },
              { id: 'REAL_ESTATE', title: 'REAL ESTATE', desc: 'Luxury spatial marketing and narrative.' },
              { id: 'BUSINESS_WEB', title: 'BUSINESS WEB', desc: 'CRO-optimized SaaS and digital portals.' },
              { id: 'WEB_DEVELOPMENT', title: 'WEB DEVELOPMENT', desc: 'Full-stack infrastructure and modules.' },
              { id: 'INTERIOR_DESIGN', title: 'INTERIOR DESIGN', desc: 'Atmospheric spatial flow and materials.' },
              { id: 'ART_CREATIVE', title: 'ART & CREATIVE', desc: 'High-concept lore and world building.' },
              { id: 'VISUAL_ASSET', title: 'VISUAL ASSET', desc: 'Photorealistic 8k cinematic lighting.' }
            ].map(cat => (
              <button key={cat.id} onClick={() => { setForm(f => ({ ...f, category: cat.id as ProjectCategory })); navigateTo('CONFIG'); }} className="mobbin-card p-12 flex flex-col items-center text-center group bg-white shadow-sm">
                <CategoryIcon type={cat.id as ProjectCategory} />
                <h3 className="text-2xl font-black uppercase mb-4 group-hover:text-[#0055FF] transition-colors">{cat.title}</h3>
                <p className="text-gray-500 italic font-medium leading-relaxed max-w-[240px]">{cat.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 'CONFIG' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in py-12 text-center">
            <h2 className="text-[10vw] font-black italic uppercase tracking-tighter leading-[0.85] mb-16">Vision.</h2>
            <TextArea label="HIGH LEVEL GOAL" placeholder="What architectural goal are we synthesizing?" value={form.high_level_goal} onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} className="text-lg py-12 min-h-[300px] rounded-[48px] px-14 bg-white" />
            <button onClick={startDiscovery} className="mobbin-btn-primary w-full text-xl py-10 shadow-2xl">Initiate Discovery</button>
          </div>
        )}

        {step === 'DISCOVERY' && (
          <div className="animate-fade-in space-y-12 max-w-5xl mx-auto py-8">
            <div className="space-y-16">
              {interviewQuestions.map(q => (
                <div key={q.id} className="mobbin-card p-12 space-y-10 flex flex-col items-center text-center">
                  <div className="space-y-4 max-w-3xl">
                    <h4 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-[1.1]">{q.question}</h4>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0055FF] bg-blue-50 px-4 py-1.5 rounded-full inline-block">{q.context}</p>
                  </div>
                  
                  {q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-5 px-4 md:px-12">
                      {q.options.map((opt, idx) => {
                        const { technical, simple } = parseOption(opt);
                        return (
                          <button key={idx} onClick={() => handleAppendOption(q.id, opt)} className="group flex flex-col items-center px-10 py-6 bg-white hover:bg-black hover:text-white transition-all rounded-[32px] shadow-sm border-2 border-slate-100 hover:border-black hover:scale-105 active:scale-95 text-center min-w-[220px]">
                            <span className="text-[12px] font-black uppercase tracking-widest transition-colors">+ {technical}</span>
                            {simple && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white/60 mt-2 italic">{simple}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <TextArea placeholder="Elaborate or select options above..." value={interviewAnswers[q.id] || ""} onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))} className="bg-slate-50/50 border-none rounded-[40px] min-h-[160px] text-center px-14 text-lg font-medium" />
                </div>
              ))}
            </div>
            <button onClick={startMatrix} className="mobbin-btn-primary w-full py-12 text-2xl shadow-2xl mt-12">Finalize Strategy Matrix</button>
          </div>
        )}

        {step === 'MATRIX' && (
          <div className="animate-fade-in space-y-12">
            <h2 className="text-[8vw] font-black italic uppercase tracking-tighter mb-16 leading-none">Logic Matrix.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {mastermindSuggestions.map(cat => (
                <div key={cat.category} className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic ml-4">{cat.category}</h4>
                  <div className="space-y-6">
                    {cat.options.map(opt => (
                      <button key={opt.label} onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} className={selectedSuggestions[cat.category] === opt.technical_value ? 'matrix-card-black ring-8 ring-blue-500/10' : 'matrix-card-white'}>
                        <h5 className="text-2xl font-black uppercase mb-4 leading-tight">{opt.label}</h5>
                        <p className={`text-sm font-bold uppercase italic leading-relaxed ${selectedSuggestions[cat.category] === opt.technical_value ? 'opacity-80' : 'text-gray-400'}`}>{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={synthesizeFinal} className="mobbin-btn-primary w-full py-12 mt-16 text-3xl shadow-3xl">Synthesize Neural Release</button>
          </div>
        )}

        {step === 'FINAL' && output && (
          <div className="animate-fade-in space-y-20 py-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-black pb-10 gap-8">
              <h2 className="text-[10vw] font-black italic uppercase tracking-tighter leading-none">Release.</h2>
              <div className="flex gap-4">
                <button onClick={() => downloadFile(output.FINAL_PROMPT, `release-${Date.now()}.md`, 'text/markdown')} className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-xl">Export MD</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
              <div className="space-y-16">
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Production Prompt</h4>
                    <button onClick={() => copyToClipboard(output.FINAL_PROMPT)} className="text-[11px] font-black uppercase text-slate-400 hover:text-black underline underline-offset-8 decoration-2 hover:decoration-[#0055FF]">Copy String</button>
                  </div>
                  <div className="mobbin-card p-14 bg-black text-white/90 font-mono text-sm leading-relaxed max-h-[800px] overflow-y-auto select-all shadow-3xl border-none custom-scrollbar">
                    {output.FINAL_PROMPT}
                  </div>
                </div>

                {generatedVisual && (
                  <div className="space-y-10">
                    <div className="flex justify-between items-center px-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Neural Visualization</h4>
                    </div>
                    <img src={generatedVisual} className="w-full rounded-[64px] shadow-3xl border-8 border-white aspect-video object-cover" alt="Architectural Reference" />
                    
                    {/* REPROMPT FEATURE */}
                    <div className="mobbin-card p-10 bg-white border-2 border-blue-100/20 space-y-6">
                      <div className="space-y-2">
                        <h5 className="text-xs font-black uppercase tracking-widest text-slate-800">Adjust Visualization</h5>
                        <p className="text-[10px] text-slate-400 font-bold italic">Request specific corrections or atmospheric shifts.</p>
                      </div>
                      <div className="flex flex-col gap-4">
                        <TextArea placeholder="e.g. 'Make it more brutalist', 'Add sunset lighting', 'Change materials to black marble'..." value={refinementPrompt} onChange={e => setRefinementPrompt(e.target.value)} className="bg-slate-50 min-h-[120px] text-sm py-5 px-8 rounded-[32px] border-none" />
                        <button onClick={handleImageRefinement} disabled={!refinementPrompt} className={`w-full py-5 rounded-full font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl ${refinementPrompt ? 'bg-black text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>Refine Neural Assets</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-20">
                <div className="space-y-8">
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Neural Changelog</h4>
                  <div className="mobbin-card p-10 border-none bg-slate-100/50 font-mono text-[11px] text-slate-600 leading-relaxed italic border-l-[12px] border-slate-300">
                    {output.COMMIT_MESSAGE}
                  </div>
                </div>
                <div className="space-y-8">
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Architectural Blueprint</h4>
                  <div className="mobbin-card p-12 text-3xl italic font-black leading-tight text-slate-800 border-l-[24px] border-[#0055FF] shadow-xl">
                    {output.APP_BLUEPRINT}
                  </div>
                </div>
                <div className="space-y-10">
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Integrated Logic Stacks</h4>
                  <div className="space-y-8">
                    {output.APPLIED_STRATEGIES.map(s => (
                      <div key={s.name} className="mobbin-card p-10 border-none bg-white shadow-md hover:translate-x-4 transition-transform border-l-4 border-slate-50">
                        <h5 className="text-xl font-black uppercase mb-2 italic tracking-tight">{s.name}</h5>
                        <p className="text-sm text-slate-400 italic font-bold leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={() => { setStep('INITIAL'); setStepHistory([]); }} className="mobbin-btn-primary w-full py-12 text-2xl shadow-2xl mt-20">Initiate New Synthesis</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
