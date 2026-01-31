
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
    try {
      await navigator.clipboard.writeText(text);
      alert("Prompt copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy!", err);
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert("Prompt copied to clipboard! (Fallback)");
      } catch (err) {
        alert("Failed to copy prompt.");
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadPrompt = (text: string) => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architect-quantum-prompt-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startDiscovery = async () => {
    if (!form.high_level_goal) return alert("Please define your high-level goal.");
    setLoading(true);
    try {
      const res = await generateInterviewQuestions(form);
      setInterviewQuestions(res);
      setStep('DISCOVERY');
    } catch (e) { 
      console.error(e);
      alert("Error during discovery."); 
    } finally { setLoading(false); }
  };

  const startMatrix = async () => {
    setLoading(true);
    try {
      const res = await generateMastermindSuggestions(form);
      setMastermindSuggestions(res);
      const initial: Record<string, string> = {};
      res.forEach(cat => {
        initial[cat.category] = cat.options[0].technical_value;
      });
      setSelectedSuggestions(initial);
      setStep('MATRIX');
    } catch (e) { 
      console.error(e);
      alert("Error generating strategy matrix."); 
    } finally { setLoading(false); }
  };

  const synthesizeFinal = async () => {
    setLoading(true);
    try {
      const enrichedInput = {
        ...form,
        matrix_selections: selectedSuggestions
      };
      const res = await generateArchitectPrompt(enrichedInput);
      setOutput(res);
      if (form.visual_inspiration_mode) {
        const img = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || form.high_level_goal);
        setGeneratedVisual(img);
      }
      setStep('FINAL');
    } catch (e) { 
      console.error(e);
      alert("Error during final synthesis."); 
    } finally { setLoading(false); }
  };

  const categories = [
    { id: 'ENGINEERING' as ProjectCategory, title: 'ENGINEERING', desc: 'Gadgets, tools, or complex mechanical systems.' },
    { id: 'REAL_ESTATE' as ProjectCategory, title: 'REAL ESTATE', desc: 'Property listings, site descriptions, or floor plans.' },
    { id: 'BUSINESS_WEB' as ProjectCategory, title: 'BUSINESS WEB', desc: 'Commercial landing pages, e-commerce, and corporate portals.' },
    { id: 'WEB_DEVELOPMENT' as ProjectCategory, title: 'WEB DEVELOPMENT', desc: 'SaaS, portfolios, or full-stack architectures.' },
    { id: 'INTERIOR_DESIGN' as ProjectCategory, title: 'INTERIOR DESIGN', desc: 'Spatial concepts, material moodboards, and furniture.' },
    { id: 'ART_CREATIVE' as ProjectCategory, title: 'ART & CREATIVE', desc: 'Narrative storytelling, character design, and lore.' },
    { id: 'VISUAL_ASSET' as ProjectCategory, title: 'VISUAL ASSET', desc: 'Cinematic lighting, camera settings, and 8k renders.' }
  ];

  const updateConfig = (key: keyof CategoryConfig, val: string) => {
    setForm(f => ({ ...f, config: { ...f.config, [key]: val } }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
      <header className="h-24 px-12 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-50 border-b border-white/20">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setStep('INITIAL')}>
          <div className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl shadow-lg">B</div>
          <h1 className="text-xl font-black uppercase tracking-tight">
            Architect<span className="text-[#0055FF]">.Quantum</span>
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-10">
          <div className={`nav-link ${step !== 'INITIAL' ? 'active' : 'text-gray-400'}`} onClick={() => setStep('INITIAL')}>Synthesis</div>
          <div className="nav-link text-gray-400">Vault</div>
        </nav>

        <div className="flex items-center gap-6">
          <div className="simple-mode-pill">
            <span>Simple Mode</span>
            <div className="w-8 h-4 bg-gray-300 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <button className="btn-enterprise">Enterprise Access</button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-12 py-12 flex-1">
        {loading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#0055FF]/10 border-t-[#0055FF] rounded-full animate-spin mb-8 shadow-2xl" />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 italic">Neural Synthesis In Progress...</span>
          </div>
        )}

        {step === 'INITIAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in pt-8">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => {
                  setForm(f => ({ ...f, category: cat.id, domain_context: cat.title }));
                  setStep('CONFIG');
                }}
                className="mobbin-card p-12 lg:p-16 flex flex-col items-center justify-center text-center group bg-white shadow-sm border-transparent hover:border-[#0055FF]/20"
              >
                <CategoryIcon type={cat.id} />
                <h3 className="text-2xl font-black uppercase mb-4 group-hover:text-[#0055FF] transition-colors">{cat.title}</h3>
                <p className="text-gray-500 italic font-medium leading-relaxed max-w-[240px]">{cat.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 'CONFIG' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in py-12">
             <h2 className="text-[12vw] md:text-[8vw] font-black italic uppercase tracking-tighter leading-[0.85] text-center mb-16">
              Architecture.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <TextArea 
                  label="HIGH LEVEL GOAL" 
                  placeholder="Define your business objective or product vision..."
                  value={form.high_level_goal}
                  onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))}
                  className="text-lg py-8 min-h-[200px] rounded-[40px] px-10 border-slate-100 bg-slate-50/30"
                />
              </div>

              {form.category === 'BUSINESS_WEB' && (
                <>
                  <Select label="Site Type" value={form.config?.siteType} onChange={e => updateConfig('siteType', e.target.value)}>
                    <option value="Landing Page">Landing Page (Single Goal)</option>
                    <option value="Corporate Site">Corporate Portal (Brand focused)</option>
                    <option value="E-commerce">E-commerce Storefront</option>
                    <option value="B2B Platform">B2B SaaS / Solution</option>
                  </Select>
                  <Select label="Conversion Goal" value={form.config?.conversionGoal} onChange={e => updateConfig('conversionGoal', e.target.value)}>
                    <option value="Lead Generation">Lead Generation (Form completions)</option>
                    <option value="Direct Sales">Direct Sales (Revenue)</option>
                    <option value="Brand Awareness">Brand Awareness (Engagement)</option>
                    <option value="User Onboarding">User Onboarding (Registrations)</option>
                  </Select>
                  <TextInput label="Business Sector" placeholder="e.g. Fintech, Healthcare, Logistics" value={form.config?.businessSector} onChange={e => updateConfig('businessSector', e.target.value)} />
                  <Select label="Brand Voice" value={form.config?.brandVoice} onChange={e => updateConfig('brandVoice', e.target.value)}>
                    <option value="Authoritative">Authoritative & Secure</option>
                    <option value="Friendly">Friendly & Approachable</option>
                    <option value="Disruptive">Disruptive & Bold</option>
                    <option value="Minimalist">Minimalist & Luxury</option>
                  </Select>
                </>
              )}

              {form.category === 'WEB_DEVELOPMENT' && (
                <>
                  <Select label="Framework" value={form.config?.framework} onChange={e => updateConfig('framework', e.target.value)}>
                    <option value="React">React / Next.js</option>
                    <option value="Vue">Vue / Nuxt</option>
                    <option value="Svelte">SvelteKit</option>
                    <option value="Vanilla">Vanilla JS / TS</option>
                  </Select>
                  <Select label="Stack Type" value={form.config?.stackType} onChange={e => updateConfig('stackType', e.target.value)}>
                    <option value="Frontend Only">Frontend Focused</option>
                    <option value="Fullstack">Fullstack Application</option>
                    <option value="API Focused">API / Backend Focused</option>
                    <option value="Static Site">Static Site Generator</option>
                  </Select>
                </>
              )}
              {form.category === 'ENGINEERING' && (
                <>
                  <Select label="Scale" value={form.config?.scale} onChange={e => updateConfig('scale', e.target.value)}>
                    <option value="Micro">Micro (Electronic components)</option>
                    <option value="Human">Human (Handheld tools)</option>
                    <option value="Industrial">Industrial (Machinery)</option>
                  </Select>
                  <TextInput label="Primary Material" placeholder="e.g. Carbon Fiber, Graphene" value={form.config?.material} onChange={e => updateConfig('material', e.target.value)} />
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
                    <h4 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-[1.1]">
                      {q.question}
                    </h4>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0055FF]">
                      {q.context}
                    </p>
                  </div>
                  <TextArea 
                    placeholder="Provide depth for a higher precision result..."
                    value={interviewAnswers[q.id] || ""}
                    onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                    className="bg-slate-50/50 border-none rounded-[32px] min-h-[140px] text-center px-12"
                  />
                </div>
              ))}
            </div>
            <button onClick={startMatrix} className="mobbin-btn-primary w-full py-8 text-xl shadow-xl">Synthesize Matrix</button>
          </div>
        )}

        {step === 'MATRIX' && (
          <div className="animate-fade-in space-y-12">
             <div className="flex justify-between items-end mb-12 border-b-2 border-slate-200 pb-8">
              <h2 className="text-7xl font-black italic uppercase tracking-tighter">Synthesis Matrix.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mastermindSuggestions.map(cat => (
                <div key={cat.category} className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic ml-4">{cat.category}</h4>
                  <div className="space-y-6">
                    {cat.options.map(opt => (
                      <button 
                        key={opt.label} 
                        onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} 
                        className={selectedSuggestions[cat.category] === opt.technical_value ? 'matrix-card-black' : 'matrix-card-white'}
                      >
                        <h5 className="text-2xl font-black uppercase mb-4 leading-tight">{opt.label}</h5>
                        <p className={`text-sm font-bold uppercase italic leading-relaxed ${selectedSuggestions[cat.category] === opt.technical_value ? 'opacity-80' : 'text-gray-400'}`}>
                          {opt.description}
                        </p>
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
                    <div className="flex gap-4">
                      <button 
                        onClick={() => copyToClipboard(output.FINAL_PROMPT)}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-black transition-colors"
                      >
                        Copy to clipboard
                      </button>
                      <button 
                        onClick={() => downloadPrompt(output.FINAL_PROMPT)}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-black transition-colors"
                      >
                        Download (.md)
                      </button>
                    </div>
                  </div>
                  <div className="mobbin-card p-12 bg-black text-white/90 font-mono text-sm leading-relaxed custom-scrollbar max-h-[700px] overflow-y-auto select-all shadow-3xl border-none">
                    {output.FINAL_PROMPT}
                  </div>
                </div>
                {generatedVisual && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Reference Frame</h4>
                    <img src={generatedVisual} className="w-full rounded-[60px] shadow-3xl border-8 border-white" alt="Output Reference" />
                  </div>
                )}
              </div>

              <div className="space-y-16">
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Structural Blueprint</h4>
                  <div className="mobbin-card p-10 text-2xl italic font-black leading-tight text-slate-800 border-l-[16px] border-[#0055FF]">
                    {output.APP_BLUEPRINT}
                  </div>
                </div>
                
                <div className="space-y-8">
                  <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#0055FF] italic">Applied Logic Stacks</h4>
                  <div className="space-y-6">
                    {output.APPLIED_STRATEGIES.map(s => (
                      <div key={s.name} className="mobbin-card p-8 border-none bg-white shadow-sm hover:shadow-md transition-shadow">
                        <h5 className="text-lg font-black uppercase mb-1 italic tracking-tight">{s.name}</h5>
                        <p className="text-sm text-slate-400 italic font-bold">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-8 pt-16 border-t-2 border-slate-100">
              <button onClick={() => setStep('INITIAL')} className="mobbin-btn-primary flex-1 py-10 text-xl">New Project Initiation</button>
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="px-12 border-4 border-black rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-black hover:text-white transition-all">Top</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
