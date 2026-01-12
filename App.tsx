import React, { useState, useEffect } from 'react';
import { PromptInput, PromptOutput, MarketingKit, TargetAI } from './types';
import { TextArea, Select } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  magicFillMetaInputs, 
  generateVisualImage,
  generateMarketingKit
} from './services/geminiService';

const Icons = {
  Sparkles: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Globe: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  Check: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  ChevronDown: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
  ArrowLeft: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Robot: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V5.73c-.6-.34-1-1-1-1.73a2 2 0 0 1 2-2M9 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2m6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2M9 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2m6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /></svg>,
  Shield: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A3.33 3.33 0 0018.377 2.864l-6.377-2.318a1 1 0 00-.636 0L4.987 2.864a3.33 3.33 0 00-2.241 3.12c0 5.23 3.593 10.395 8.783 12.028a1 1 0 00.636 0c5.19-1.633 8.783-6.798 8.783-12.028a3.33 3.33 0 00-.544-1.748z" /></svg>,
  Copy: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
};

const SHARDS = {
  web_type: ["Luxury Salon", "SaaS Analytics", "Fashion E-commerce", "Crypto Portfolio", "Architect Portfolio", "EdTech LMS", "Boutique Hotel", "Healthcare Portal", "Real Estate Engine", "Logistics Hub", "Creative Agency", "Restaurant / Menu", "Esports Community", "Talent Job Board", "Event Microsite"],
  web_layout_blocks: ["Full Hero", "Split Hero", "Bento Grid", "Parallax Sections", "Sticky Mega-Menu", "Masonry Gallery", "Pricing Matrix", "Comparison Table", "Stats Overlay", "Testimonial Carousel", "Interactive Timeline", "Accordion FAQ", "Video Background", "Floating CTA"],
  web_aesthetic: ["Glassmorphism", "Minimalist White", "Futuristic Dark", "Editorial Serif", "Neumorphism", "Raw Brutalist", "Cinematic Wide", "Apple-style Polish", "Clean SaaS Blue", "Retro 80s Cyber", "Monochrome Luxury"],
  web_typography: ["Modern Sans (Inter)", "Editorial Serif (Playfair)", "Technical Mono (JetBrains)", "Bold Display (Bebas)", "System Native (SF Pro)", "Geometric Sans (Poppins)"],
  web_colors: ["Midnight (#050608)", "SaaS Blue (#2563EB)", "Electric Indigo (#6366F1)", "Emerald Glow", "Golden Noir", "Slate & Snow", "Cyber Gradient"],
};

const GUIDED_FLOWS = {
  'Website': { title: 'WEBSITE CONSTRUCTOR', icon: Icons.Globe, questions: [
    { key: 'web_type', label: 'Platform DNA' },
    { key: 'web_layout_blocks', label: 'Layout Shards' },
    { key: 'web_aesthetic', label: 'Visual Aesthetic' },
    { key: 'web_typography', label: 'Typography' },
    { key: 'web_colors', label: 'Color Matrix' },
  ]},
  'Protocol': { title: 'SYSTEM PROTOCOL', icon: Icons.Shield, questions: [
    { key: 'target_AI', label: 'Intelligence Target' },
    { key: 'reasoning_visibility', label: 'Reasoning Mode' },
    { key: 'tone_style', label: 'Operational Tone' },
  ]}
};

const TARGET_MODELS: TargetAI[] = ["Gemini 3 Flash", "Gemini 3 Pro", "GPT-4o", "Claude 3.5 Sonnet", "DeepSeek R1"];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY'>('BUILD');
  const [isGuidedMode, setIsGuidedMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [marketingKit, setMarketingKit] = useState<MarketingKit | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", high_level_goal: "", task_type: "Synthesis", domain_context: "",
    user_persona: "Lead Prompt Architect", tone_style: "Professional", output_format: "Markdown",
    length_and_depth: "Detailed", reasoning_visibility: "brief", language: "English",
    visual_inspiration_mode: true
  });
  const [guidedState, setGuidedState] = useState({ category: null as string | null, index: 0 });

  const handleExecute = async () => {
    if (!form.high_level_goal) return;
    setLoading(true);
    try {
      const res = await generateArchitectPrompt(form);
      setOutput(res);
      if (form.visual_inspiration_mode && res.VISUAL_INSPIRATION_PROMPT) {
        const img = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT);
        setGeneratedVisual(img);
      }
      const kit = await generateMarketingKit(res.FINAL_PROMPT, form.high_level_goal, form.language);
      setMarketingKit(kit);
    } catch (e) {
      console.error("Synthesis failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleShard = (key: string, value: string) => {
    const current = (form as any)[key] || "";
    const items = current.split(', ').filter(Boolean);
    const updated = items.includes(value) ? items.filter((i: string) => i !== value) : [...items, value];
    setForm(prev => ({ ...prev, [key]: updated.join(', ') }));
  };

  const SuggestionDropdown = ({ field, items }: { field: string, items: string[] }) => {
    if (openDropdown !== field) return null;
    const current = (form as any)[field] || "";
    const selected = current.split(', ').filter(Boolean);
    return (
      <div className="absolute top-full left-0 right-0 mt-3 glass rounded-2xl shadow-2xl z-[100] p-4 max-h-[320px] overflow-y-auto custom-scrollbar animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{selected.length} Selected</span>
          <button onClick={() => setOpenDropdown(null)} className="text-[10px] font-black uppercase bg-indigo-600 px-3 py-1 rounded-full text-white">Done</button>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {items.map(item => (
            <button key={item} onClick={() => toggleShard(field, item)} className={`text-left p-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${selected.includes(item) ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'hover:bg-white/5 text-slate-400'}`}>
              {item} {selected.includes(item) && <Icons.Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-slate-100 overflow-hidden selection:bg-indigo-500/30">
      <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-[#050608]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter leading-none">ARCHITECT<span className="text-indigo-500">.IO</span></h1>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Quantum Prompt Synthesis V6.0</p>
          </div>
          <nav className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {['BUILD', 'HISTORY'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black text-slate-500 uppercase">Status</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Core Online</p>
          </div>
          <button className="bg-white text-black text-[10px] font-black px-6 py-3 rounded-full uppercase hover:bg-slate-200 transition-all shadow-xl active:scale-95">Upgrade Pro</button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in">
            <div className="relative w-24 h-24 mb-10">
               <div className="absolute inset-0 border-[6px] border-indigo-500/10 rounded-full" />
               <div className="absolute inset-0 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(79,70,229,0.3)]" />
            </div>
            <p className="text-indigo-400 font-black uppercase tracking-[0.6em] italic animate-pulse text-sm">Synthesizing Neural Shards...</p>
          </div>
        )}

        {activeTab === 'BUILD' && isGuidedMode && !guidedState.category && (
          <div className="h-full flex flex-col items-center justify-center px-10 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none" />
            <h2 className="text-[10vw] font-black italic mb-20 opacity-[0.03] uppercase select-none leading-none text-center pointer-events-none absolute">SELECT DOMAIN</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl z-10">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button key={key} onClick={() => setGuidedState({ category: key, index: 0 })} className="group relative h-[320px] glass rounded-[4rem] p-16 flex flex-col items-center justify-center transition-all duration-500 hover:border-indigo-500/50 hover:scale-[1.03] hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
                  <flow.icon className="w-20 h-20 text-indigo-400 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
                  <h3 className="text-xl font-black tracking-[0.4em] uppercase text-white italic">{flow.title}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-4 opacity-0 group-hover:opacity-100 transition-opacity">Launch Synthesis Flow</p>
                </button>
              ))}
            </div>
            <button onClick={() => setIsGuidedMode(false)} className="mt-20 text-slate-600 font-black uppercase text-[11px] hover:text-indigo-400 transition-colors tracking-widest border-b border-transparent hover:border-indigo-500 pb-1">Enter Manual Architect Mode</button>
          </div>
        )}

        {activeTab === 'BUILD' && isGuidedMode && guidedState.category && (
          <div className="h-full flex overflow-hidden bg-[#050608]">
            <div className="flex-1 flex flex-col p-16 overflow-y-auto custom-scrollbar relative">
              <button onClick={() => setGuidedState({ category: null, index: 0 })} className="absolute top-16 left-16 flex items-center gap-3 text-[11px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-widest"><Icons.ArrowLeft className="w-4 h-4" /> Reset Evolution</button>
              <div className="max-w-4xl mx-auto w-full pt-20 space-y-16">
                {(() => {
                  const flow = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS];
                  const q = flow.questions[guidedState.index];
                  const options = (SHARDS as any)[q.key] || (q.key === 'target_AI' ? TARGET_MODELS : []);
                  return (
                    <div className="space-y-12 animate-fade-in">
                      <div className="text-center">
                        <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4 block italic">{guidedState.category} Evolution Flow</span>
                        <h2 className="text-7xl font-black italic tracking-tighter uppercase leading-none text-white">{q.label}</h2>
                        <p className="text-slate-500 mt-6 text-sm font-medium uppercase tracking-widest">Select components to form the core architecture</p>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {options.map((opt: string) => {
                          const isSelected = ((form as any)[q.key] || "").split(', ').includes(opt);
                          return (
                            <button key={opt} onClick={() => toggleShard(q.key, opt)} className={`p-8 rounded-[2rem] text-[13px] font-black uppercase text-center border transition-all duration-300 ${isSelected ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_40px_rgba(79,70,229,0.3)] text-white scale-[1.02]' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'}`}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-col items-center gap-6 pt-10">
                        {guidedState.index < flow.questions.length - 1 ? (
                          <button onClick={() => setGuidedState(p => ({ ...p, index: p.index + 1 }))} className="px-20 py-5 bg-white text-black font-black uppercase text-xs rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all tracking-widest">Advance To Next Layer</button>
                        ) : (
                          <div className="w-full max-w-md space-y-8">
                            <TextArea label="Synthesis Goal" value={form.high_level_goal} onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} placeholder="Briefly describe the ultimate goal of this prompt..." className="bg-white/5 border-white/10" />
                            <button onClick={handleExecute} disabled={!form.high_level_goal} className="w-full py-6 bg-indigo-600 text-white font-black uppercase text-xs rounded-full shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all tracking-[0.4em]">Initialize Final Synthesis</button>
                          </div>
                        )}
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{guidedState.index + 1} / {flow.questions.length} Layers Defined</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'BUILD' && !isGuidedMode && (
          <div className="h-full flex overflow-hidden">
            <aside className="w-[480px] border-r border-white/5 bg-[#08090b] p-12 overflow-y-auto custom-scrollbar space-y-12 flex-shrink-0 relative z-10" onClick={() => setOpenDropdown(null)}>
              <div className="flex items-center gap-5 text-emerald-400 mb-2">
                <Icons.Robot className="w-10 h-10" /> 
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] italic">ARCHITECT ACTIVE</h4>
                  <p className="text-[10px] font-bold text-emerald-600/60 uppercase">Manual Matrix Control Enabled</p>
                </div>
              </div>
              <section className="space-y-4">
                <TextArea label="Synthesis Seed" value={form.high_level_goal} onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} placeholder="Describe your prompt requirements..." className="min-h-[160px] text-lg font-medium" />
                <button onClick={() => { setLoading(true); magicFillMetaInputs(form.high_level_goal, form.language).then(res => { setForm(p => ({ ...p, ...res })); setLoading(false); }); }} className="w-full py-4 border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[11px] font-black uppercase rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-indigo-500/10 transition-all shadow-lg active:scale-95"><Icons.Sparkles className="w-5 h-5" /> Meta-Fill Architecture</button>
              </section>
              
              <div className="space-y-8 pt-8 border-t border-white/5">
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Design Matrix</h5>
                {Object.keys(SHARDS).map(key => (
                  <div key={key} className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setOpenDropdown(openDropdown === key ? null : key)} className="w-full p-5 bg-white/5 border border-white/5 rounded-[1.5rem] text-left text-[11px] font-black text-slate-400 flex justify-between items-center transition-all hover:border-white/10 hover:bg-white/[0.07] uppercase tracking-widest">
                      {(key.replace('web_', '').replace('_', ' '))}
                      <Icons.ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openDropdown === key ? 'rotate-180 text-indigo-400' : ''}`} />
                    </button>
                    <SuggestionDropdown field={key} items={(SHARDS as any)[key]} />
                    { (form as any)[key] && (
                      <div className="mt-3 text-[10px] font-bold text-indigo-400 italic px-4 flex flex-wrap gap-2">
                        { (form as any)[key].split(', ').map((s: string) => <span key={s} className="bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">{s}</span>) }
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Model" value={form.target_AI} onChange={e => setForm(p => ({ ...p, target_AI: e.target.value as any }))}>
                  {TARGET_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
                <Select label="Reasoning" value={form.reasoning_visibility} onChange={e => setForm(p => ({ ...p, reasoning_visibility: e.target.value as any }))}>
                  <option value="brief">Brief</option>
                  <option value="detailed">Detailed</option>
                  <option value="hidden">Hidden</option>
                </Select>
              </div>

              <button onClick={handleExecute} disabled={!form.high_level_goal} className="w-full py-7 bg-indigo-600 text-white font-black uppercase tracking-[0.5em] rounded-full shadow-[0_30px_60px_rgba(79,70,229,0.3)] hover:bg-indigo-500 active:scale-95 transition-all text-sm mt-8">Synthesize Shards</button>
            </aside>
            <main className="flex-1 p-20 overflow-y-auto custom-scrollbar bg-[#050608] relative">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
              {output ? (
                <div className="max-w-5xl mx-auto space-y-32 pb-40 animate-fade-in">
                  <div className="space-y-16">
                    <div className="flex justify-between items-end border-b border-white/10 pb-16">
                      <div className="space-y-4">
                        <h3 className="text-8xl font-black italic tracking-tighter uppercase leading-none text-white">Synthesized Shard</h3>
                        <div className="flex gap-4">
                          <span className="text-indigo-500 font-black text-[11px] uppercase tracking-widest border border-indigo-500/30 px-3 py-1 rounded-full">Output V6.0</span>
                          <span className="text-slate-500 font-black text-[11px] uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full">{form.target_AI}</span>
                        </div>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(output.FINAL_PROMPT)} className="group flex items-center gap-3 px-12 py-5 bg-white text-black font-black uppercase text-xs rounded-full hover:bg-slate-200 transition-all shadow-2xl active:scale-95 tracking-widest"><Icons.Copy className="w-5 h-5 group-hover:scale-110 transition-transform" /> Copy Architecture</button>
                    </div>
                    <div className="bg-[#0e0f14] border border-white/5 p-20 rounded-[4rem] text-slate-300 font-mono text-xl leading-relaxed shadow-[0_60px_100px_rgba(0,0,0,0.6)] whitespace-pre-wrap relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none uppercase font-black tracking-[1em] text-4xl transform rotate-90 origin-top-right">ARCHITECT</div>
                      {output.FINAL_PROMPT}
                    </div>
                  </div>

                  {generatedVisual && (
                    <div className="space-y-12 animate-fade-in">
                      <h4 className="text-[12px] font-black uppercase text-indigo-500 tracking-[0.6em] italic border-l-4 border-indigo-600 pl-6">Visual Concept Synthesis</h4>
                      <div className="relative group">
                        <div className="absolute -inset-4 bg-indigo-500/10 rounded-[4rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={generatedVisual} className="w-full rounded-[3.5rem] border border-white/10 shadow-3xl relative" alt="Synthesis Visual" />
                      </div>
                    </div>
                  )}

                  {marketingKit && (
                    <div className="space-y-20 pt-20 border-t border-white/5 animate-fade-in">
                      <div className="flex items-center gap-6">
                        <Icons.Sparkles className="w-12 h-12 text-emerald-500" />
                        <div>
                          <h4 className="text-5xl font-black italic tracking-tighter uppercase text-white">Growth Core</h4>
                          <p className="text-emerald-500 font-black text-[11px] uppercase tracking-widest mt-2 italic">Multi-Channel Marketing Synthesis Complete</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {[
                          {t: "Landing Architecture", c: marketingKit.landing_page, i: Icons.Globe}, 
                          {t: "Acquisition Shards", c: marketingKit.social_ads, i: Icons.Sparkles}, 
                          {t: "Operational Logic", c: marketingKit.email_sequence, i: Icons.Robot}, 
                          {t: "Visual Protocol", c: marketingKit.visual_style_guide, i: Icons.Shield}
                        ].map((item, i) => (
                          <div key={i} className="bg-[#0e0f14] p-16 rounded-[3.5rem] border border-white/5 space-y-8 group hover:border-indigo-500/20 transition-all duration-500 shadow-2xl">
                            <div className="flex items-center gap-4">
                              <item.i className="w-8 h-8 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                              <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] italic group-hover:text-white transition-colors">{item.t}</h5>
                            </div>
                            <div className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">{item.c}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-[0.03] pointer-events-none select-none">
                  <h1 className="text-[15vw] font-black italic uppercase leading-[0.8] tracking-tighter">AWAITING<br/>QUANTUM<br/>SEED</h1>
                </div>
              )}
            </main>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="h-full flex flex-col items-center justify-center p-20 animate-fade-in">
             <div className="text-center space-y-6">
                <Icons.Robot className="w-20 h-20 text-slate-800 mx-auto" />
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Vault Empty</h3>
                <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">No previous synthesis records found in local memory</p>
                <button onClick={() => setActiveTab('BUILD')} className="text-indigo-500 font-black uppercase text-[11px] tracking-widest mt-10 border border-indigo-500/20 px-10 py-4 rounded-full hover:bg-indigo-500/10 transition-all">Initialize First Synthesis</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;