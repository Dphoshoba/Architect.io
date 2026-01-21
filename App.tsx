import React, { useState, useEffect, useRef } from 'react';
import { PromptInput, PromptOutput, MarketingKit, TargetAI, UserStatus, HistoryItem, MastermindSuggestionCategory } from './types';
import { TextArea, Select, TextInput } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  generateVisualImage, 
  generateMarketingKit,
  generateMastermindSuggestions
} from './services/geminiService';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const Icons = {
  Sparkles: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Globe: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  ArrowLeft: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Robot: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V5.73c-.6-.34-1-1-1-1.73a2 2 0 0 1 2-2M9 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2m6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2M9 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2m6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /></svg>,
  Photo: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Mic: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 19v4m-4 0h8" /></svg>,
  Wrench: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Copy: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
  Download: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Volume2: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>,
  VolumeX: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 9l4 4m0-4l-4 4" /></svg>,
  Cpu: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2-2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>,
  AppWindow: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>,
  Keyboard: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
};

const MASTERMIND_COACH_INSIGHTS = {
  'Website': [
    "Identify your Platform DNA carefully. It dictates the underlying logic for all subsequent UX decisions.",
    "Layout Shards determine the conversion flow. For luxury, prioritize negative space; for SaaS, prioritize clarity.",
    "The Aesthetic layer is your brand's visceral signature. Glassmorphism signals modern transparency.",
    "Typography is the voice of your text. Choose Modern Sans for tech-forward credibility."
  ],
  'App': [
    "Clarifying the App Purpose is our first move. One or two sentences to anchor the entire engineering blueprint.",
    "Persona mapping ensures we build for the right user needs. Who is the primary protagonist of this story?",
    "Platform choice dictates our tech constraints. Responsive Web is the most versatile starting point.",
    "Defining the V1 Scope keeps us lean. Start with a Minimum Viable Product for faster iteration.",
    "Authentication shards determine security logic. Do users need persistent accounts or anonymous access?",
    "Feature prioritization is the functional heart. Which of these are absolute MUST-HAVES for launch?",
    "Interaction flow mapping defines the UX style. How should users navigate through your data logic?"
  ],
  'Professional': [
    "Your Domain sets the regulatory boundary. Choose Interior Design for spatial logic, or SaaS for structural architecture.",
    "Expertise determines the 'Intelligence Density'. Senior Principal levels unlock advanced reasoning patterns.",
    "Protocol Type defines the legal weight of the output. BoQs require extreme numerical precision.",
    "Compliance Standards are non-negotiable. ISO 9001 ensures global operational quality."
  ],
  'Simple': [
    "Enter your core directive. Dr. Architect will synthesize a high-fidelity spec based on your raw input."
  ]
};

const SHARDS = {
  web_type: [
    { label: "Luxury Salon", desc: "Elegant, high-end visual focus for premium services." },
    { label: "SaaS Analytics", desc: "Data-heavy dashboard for monitoring and software tools." },
    { label: "Fashion E-commerce", desc: "Editorial-style layouts for high-end retail collections." },
    { label: "Architect Portfolio", desc: "Minimalist, structural focus on spatial design work." }
  ],
  app_platform: [
    { label: "Responsive Web App", desc: "Cross-device compatibility through modern browsers." },
    { label: "iOS / Android Mobile", desc: "Native application optimized for smartphones." },
    { label: "Desktop (Electron)", desc: "Installed software for high-performance desktop tools." },
    { label: "AI Agent / CLI", desc: "Invisible background logic or text-based interface." }
  ],
  app_scope: [
    { label: "MVP (Fast Launch)", desc: "The bare essentials needed to prove the concept." },
    { label: "Full Scale Release", desc: "Complete production-ready suite with all logic shards." },
    { label: "Strategic Prototype", desc: "High-fidelity demo to test core user interaction." }
  ],
  app_auth: [
    { label: "Single User (Local)", desc: "No login required. Data is stored on-device only." },
    { label: "Social Login (OAuth)", desc: "Fast signup via Google, GitHub, or Apple." },
    { label: "Enterprise SSO", desc: "Secure centralized login for corporate teams." }
  ],
  app_ux_style: [
    { label: "SaaS Dashboard", desc: "Sidebar navigation with centralized data cards." },
    { label: "Bento-style Grid", desc: "Modular, tile-based layout for diverse tools." },
    { label: "Utility First", desc: "Single screen focused on a high-frequency task." }
  ],
  app_features: [
    { label: "AI Logic Shards", desc: "Integrated LLM logic for content or reasoning." },
    { label: "Real-time Sync", desc: "Live collaborative editing and data streaming." },
    { label: "Marketplace / Payments", desc: "Stripe integration for commerce logic." }
  ],
  tone_style: [
    { label: "Professional", desc: "Academic, precise, and boardroom-ready tone." },
    { label: "Creative", desc: "Expressive, evocative, and boundary-pushing." },
    { label: "Concise", desc: "Short, impactful, and efficiency-focused." }
  ]
};

const GUIDED_FLOWS = {
  'Website': { title: 'WEBSITE CONSTRUCTOR', icon: Icons.Globe, questions: [
    { key: 'web_type', label: 'Platform DNA' },
    { key: 'tone_style', label: 'Tone/Vibe' },
    { key: 'high_level_goal', label: 'Core Objective' },
  ]},
  'App': { title: 'APP ARCHITECT', icon: Icons.AppWindow, questions: [
    { key: 'high_level_goal', label: 'App Purpose' },
    { key: 'user_persona', label: 'Primary Persona' },
    { key: 'app_platform', label: 'Deployment Platform' },
    { key: 'app_scope', label: 'Release Scope' },
    { key: 'app_auth', label: 'Security & Accounts' },
    { key: 'app_features', label: 'Core Functionality' },
    { key: 'app_ux_style', label: 'Interaction Style' },
  ]},
  'Professional': { title: 'INDUSTRIAL SUITE', icon: Icons.Wrench, questions: [
    { key: 'prof_domain', label: 'Expert Domain' },
    { key: 'prof_expertise', label: 'Seniority Level' },
    { key: 'tone_style', label: 'System Tone' },
    { key: 'high_level_goal', label: 'Task Objective' },
  ]},
  'Simple': { title: 'SIMPLE PROMPT', icon: Icons.Keyboard, questions: [
    { key: 'high_level_goal', label: 'Direct Command' }
  ]},
  'Live': { title: 'LIVE VOICE PROTOCOL', icon: Icons.Mic, questions: [
    { key: 'voice_name', label: 'Voice Persona' },
  ]}
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY' | 'ACCOUNT'>('BUILD');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>({ userId: 'dev-user', plan: 'Starter', creditsRemaining: 100, totalCredits: 100 });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [mastermindSuggestions, setMastermindSuggestions] = useState<MastermindSuggestionCategory[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", high_level_goal: "", negative_prompt: "", task_type: "Synthesis", domain_context: "",
    user_persona: "Lead Architect", tone_style: "Professional", output_format: "Markdown",
    length_and_depth: "Detailed", reasoning_visibility: "brief", language: "English",
    visual_inspiration_mode: true
  });
  
  const [guidedState, setGuidedState] = useState({ 
    category: null as string | null, 
    index: 0,
    refinements: {} as Record<string, string>
  });

  useEffect(() => {
    const saved = localStorage.getItem('architect_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const speak = (text: string) => {
    if (!isSpeechEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (guidedState.category && activeTab === 'BUILD' && !isReviewing) {
        const flow = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS];
        const question = flow.questions[guidedState.index];
        const insight = getCoachingInsight(guidedState.category, guidedState.index);
        speak(`${question.label}. ${insight}`);
    }
  }, [guidedState.index, guidedState.category, activeTab, isReviewing]);

  const toggleShard = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Logic shard copied to clipboard.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAnalyzeMatrix = async () => {
    if (!form.high_level_goal && (guidedState.category === 'Simple' || guidedState.category === 'App')) return;
    setLoading(true);
    try {
      const res = await generateMastermindSuggestions({ ...form });
      setMastermindSuggestions(res);
      setIsReviewing(true);
      speak("Matrix analysis complete. Review my Mastermind refinements to finalize your architecture.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setOutput(null);
    try {
      const refinements = Object.entries(selectedSuggestions)
        .map(([cat, val]) => `[${cat} Protocol]: ${val}`)
        .join('\n');

      const fullContext = `
        PRIMARY OBJECTIVE: ${form.high_level_goal}
        VECTOR TYPE: ${guidedState.category}
        STRATEGIC REFINEMENTS:
        ${refinements}
      `;

      const res = await generateArchitectPrompt({ ...form, high_level_goal: fullContext });
      setOutput(res);

      const visualUrl = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || fullContext);
      setGeneratedVisual(visualUrl);
      
      const newItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), input: { ...form }, output: { ...res } };
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      localStorage.setItem('architect_history', JSON.stringify([newItem, ...history]));
      speak("Synthesis successful.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCoachingInsight = (category: string, step: number) => {
    const insights = (MASTERMIND_COACH_INSIGHTS as any)[category] || [];
    return (insights && insights[step]) || "Define your logic shard.";
  };

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-slate-100 overflow-hidden selection:bg-indigo-500/30">
      <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-[#050608]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-10">
          <div className="flex flex-col cursor-pointer" onClick={() => {setOutput(null); setGuidedState(p => ({...p, category: null, index: 0})); setIsReviewing(false);}}>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">ARCHITECT<span className="text-indigo-500">.IO</span></h1>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">Quantum Product Engine</p>
          </div>
          <nav className="flex gap-1 bg-white/5 p-1 rounded-xl">
            {['BUILD', 'HISTORY', 'ACCOUNT'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>{tab}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} className={`p-3 rounded-full ${isSpeechEnabled ? 'text-indigo-400' : 'text-slate-600'}`}>
            {isSpeechEnabled ? <Icons.Volume2 className="w-5 h-5" /> : <Icons.VolumeX className="w-5 h-5" />}
          </button>
          <div className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {userStatus.creditsRemaining} Units
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center animate-fade-in backdrop-blur-3xl">
            <div className="w-20 h-20 border-[5px] border-indigo-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(79,70,229,0.3)]" />
            <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-xs animate-pulse">Engaging Synthesis Shards...</p>
          </div>
        )}

        {/* VECTOR SELECTION */}
        {activeTab === 'BUILD' && !guidedState.category && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in relative">
            <div className="text-center mb-20 z-10">
              <h2 className="text-[6vw] font-black italic tracking-tighter uppercase leading-none text-white">Select Synthesis Vector</h2>
              <p className="text-slate-600 font-bold uppercase tracking-[0.4em] mt-4 italic">Dr. Architect PhD Proactive Mode Active</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 w-full max-w-7xl px-10 z-10">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button key={key} onClick={() => setGuidedState(p => ({ ...p, category: key, index: 0 }))} className="group glass rounded-[3rem] p-12 flex flex-col items-center transition-all hover:scale-105 hover:border-indigo-500/50 shadow-2xl">
                  <flow.icon className="w-14 h-14 text-indigo-400 mb-8 group-hover:text-indigo-300 group-hover:scale-110 transition-all" />
                  <h3 className="text-xl font-black uppercase text-white italic text-center leading-none">{flow.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GUIDED FLOW / SIMPLE PROMPT */}
        {activeTab === 'BUILD' && guidedState.category && !output && (
          <div className="h-full flex flex-col p-16 overflow-y-auto custom-scrollbar animate-fade-in bg-[#050608]">
            <div className="max-w-7xl mx-auto w-full space-y-12">
              <button onClick={() => setGuidedState(p => ({ ...p, category: null, index: 0 }))} className="flex items-center gap-3 text-[11px] font-black text-slate-600 hover:text-white uppercase tracking-widest italic group">
                <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Exit Vector
              </button>

              {isReviewing ? (
                <div className="space-y-16 pb-32">
                   <div className="text-center">
                      <h2 className="text-7xl font-black italic uppercase text-white tracking-tighter selection:bg-indigo-500">Strategy Room</h2>
                      <p className="text-indigo-500 font-black uppercase tracking-widest mt-4 italic">Collaborative PhD Review Shards</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {mastermindSuggestions.map((cat, i) => (
                        <div key={i} className="glass p-10 rounded-[4rem] border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
                          <h4 className="text-[13px] font-black uppercase text-indigo-400 tracking-widest italic">{cat.category}</h4>
                          <div className="flex flex-col gap-3">
                             {cat.options.map((opt, j) => (
                               <button key={j} onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} className={`p-6 rounded-3xl text-left border transition-all ${selectedSuggestions[cat.category] === opt.technical_value ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>
                                  <span className="text-[12px] font-black uppercase block tracking-wider">{opt.label}</span>
                                  <p className="text-[9px] opacity-60 font-medium uppercase mt-1 leading-tight tracking-widest">{opt.description}</p>
                               </button>
                             ))}
                          </div>
                        </div>
                      ))}
                   </div>
                   <div className="max-w-4xl mx-auto space-y-8 pt-10">
                      <TextArea label="Synthesis Objective" value={form.high_level_goal} onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} placeholder="Finalize your core directive..." className="bg-white/5 text-xl py-12 px-10 rounded-[4rem] min-h-[220px]" />
                      <button onClick={handleExecute} className="w-full py-12 bg-indigo-600 text-white font-black uppercase rounded-full shadow-[0_0_80px_rgba(79,70,229,0.4)] hover:bg-indigo-500 tracking-[0.8em] italic transition-all">Synthesize Masterwork</button>
                   </div>
                </div>
              ) : (
                <div className="space-y-12 pb-32">
                  {(() => {
                    const flow = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS];
                    const q = flow.questions[guidedState.index];
                    const options = (SHARDS as any)[q.key] || [];
                    const isChoice = Array.isArray(options) && options.length > 0;
                    const isTextArea = ['high_level_goal', 'user_persona', 'app_features'].includes(q.key);

                    return (
                      <>
                        <div className="max-w-5xl mx-auto p-12 glass rounded-[3.5rem] flex gap-10 shadow-inner border-indigo-500/10">
                          <Icons.Cpu className="w-14 h-14 text-indigo-400 flex-shrink-0 animate-pulse" />
                          <div className="space-y-2">
                             <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">PhD Coaching Insight</h4>
                             <p className="text-2xl text-slate-300 font-semibold italic leading-relaxed uppercase tracking-wider">"{getCoachingInsight(guidedState.category || '', guidedState.index)}"</p>
                          </div>
                        </div>

                        <h2 className="text-[6vw] font-black italic uppercase text-white text-center tracking-tighter leading-none">{q.label}</h2>
                        
                        {isTextArea ? (
                          <div className="max-w-5xl mx-auto w-full animate-fade-in">
                            <TextArea 
                              label={q.label} 
                              value={(form as any)[q.key] || ""} 
                              onChange={(e) => setForm(p => ({ ...p, [q.key]: e.target.value }))}
                              placeholder={`Define the ${q.label.toLowerCase()} in architectural detail...`}
                              className="bg-white/5 text-2xl py-12 px-10 rounded-[4.5rem] min-h-[350px] shadow-2xl"
                            />
                          </div>
                        ) : isChoice ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-10">
                            {options.map((opt: any) => {
                              const label = typeof opt === 'string' ? opt : opt.label;
                              const desc = typeof opt === 'string' ? null : opt.desc;
                              const isSelected = (form as any)[q.key] === label;
                              return (
                                <button key={label} onClick={() => toggleShard(q.key, label)} className={`p-10 rounded-[3rem] text-center border transition-all flex flex-col items-center justify-center gap-3 shadow-xl hover:scale-[1.03] ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_40px_rgba(79,70,229,0.3)]' : 'bg-[#11141d]/80 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}>
                                  <span className="text-[14px] font-black uppercase tracking-wider">{label}</span>
                                  {desc && <span className="text-[9px] font-medium uppercase opacity-50 leading-tight tracking-widest">{desc}</span>}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="max-w-4xl mx-auto w-full">
                            <TextInput value={(form as any)[q.key] || ""} onChange={e => setForm(p => ({ ...p, [q.key]: e.target.value }))} label={q.label} placeholder="Specify logic shard..." className="bg-white/5 text-xl p-10 rounded-full" />
                          </div>
                        )}

                        <div className="flex flex-col items-center pt-24">
                           <button onClick={guidedState.index < flow.questions.length - 1 ? () => setGuidedState(p => ({ ...p, index: p.index + 1 })) : handleAnalyzeMatrix} className="px-36 py-10 bg-white text-black font-black uppercase rounded-full shadow-[0_0_60px_rgba(255,255,255,0.1)] hover:scale-105 transition-all tracking-[0.6em] italic text-sm">
                             {guidedState.index < flow.questions.length - 1 ? 'Evolve Synthesis' : 'Enter Mastermind Analysis'}
                           </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINAL OUTPUT */}
        {activeTab === 'BUILD' && output && (
           <main className="absolute inset-0 z-[200] p-16 overflow-y-auto custom-scrollbar bg-[#050608] animate-fade-in">
               <div className="max-w-7xl mx-auto pb-48 space-y-32">
                   <div className="flex justify-between items-center border-b border-white/10 pb-12">
                      <div className="flex items-center gap-6">
                         <button onClick={() => setOutput(null)} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Icons.ArrowLeft className="w-6 h-6 text-slate-400" /></button>
                         <h3 className="text-7xl font-black italic uppercase text-white tracking-tighter">Product Blueprint</h3>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => handleCopyText(output.FINAL_PROMPT)} className="flex items-center gap-3 px-10 py-5 bg-white text-black font-black uppercase text-[11px] rounded-full hover:bg-slate-200 transition-all shadow-xl tracking-[0.2em] italic"><Icons.Copy className="w-5 h-5" /> Copy Specs</button>
                        <button onClick={() => handleDownload(output.FINAL_PROMPT, 'architect-io-specification.txt')} className="flex items-center gap-3 px-10 py-5 bg-white/5 text-white font-black uppercase text-[11px] rounded-full border border-white/10 hover:bg-white/10 transition-all tracking-[0.2em] italic"><Icons.Download className="w-5 h-5" /> Download</button>
                      </div>
                   </div>
                   
                   {output.APP_BLUEPRINT && (
                     <div className="space-y-10 animate-fade-in">
                        <div className="flex justify-between items-end pl-4">
                           <h4 className="text-indigo-400 font-black uppercase tracking-[1em] italic leading-none">STRUCTURAL SPECIFICATION</h4>
                           <div className="flex gap-2">
                             <button onClick={() => handleCopyText(output.APP_BLUEPRINT || '')} className="p-2 text-slate-500 hover:text-white transition-colors" title="Copy Blueprint"><Icons.Copy className="w-5 h-5" /></button>
                             <button onClick={() => handleDownload(output.APP_BLUEPRINT || '', 'blueprint.txt')} className="p-2 text-slate-500 hover:text-white transition-colors" title="Download Blueprint"><Icons.Download className="w-5 h-5" /></button>
                           </div>
                        </div>
                        <div className="bg-[#0e0f14] border border-white/5 p-20 rounded-[5rem] text-slate-300 font-sans text-xl leading-relaxed whitespace-pre-wrap shadow-2xl relative">
                           {output.APP_BLUEPRINT}
                        </div>
                     </div>
                   )}

                   <div className="space-y-10">
                      <div className="flex justify-between items-end pl-4">
                        <h4 className="text-indigo-400 font-black uppercase tracking-[1em] italic leading-none text-sm">IMPLEMENTATION PROMPT (SENIOR ENGINEER)</h4>
                        <div className="flex gap-2">
                            <button onClick={() => handleCopyText(output.FINAL_PROMPT)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Copy Prompt"><Icons.Copy className="w-5 h-5" /></button>
                            <button onClick={() => handleDownload(output.FINAL_PROMPT, 'implementation-prompt.txt')} className="p-2 text-slate-500 hover:text-white transition-colors" title="Download Prompt"><Icons.Download className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div className="bg-[#0e0f14]/50 border border-white/5 p-20 rounded-[5rem] text-slate-400 font-mono text-lg leading-relaxed whitespace-pre-wrap shadow-inner relative">
                        {output.FINAL_PROMPT}
                      </div>
                   </div>

                   {generatedVisual && (
                     <div className="space-y-10">
                       <h4 className="text-indigo-400 font-black uppercase tracking-[1em] pl-4 italic leading-none text-sm">VISUAL DNA RENDER</h4>
                       <img src={generatedVisual} className="w-full rounded-[6.5rem] shadow-2xl border border-white/5 hover:scale-[1.01] transition-transform duration-700" alt="Visual Synthesis" />
                     </div>
                   )}
                   
                   <button onClick={() => {setOutput(null); setIsReviewing(false); setGuidedState(p => ({...p, category: null, index: 0}));}} className="text-slate-500 font-black uppercase tracking-[1.5em] italic mx-auto block hover:text-white transition-all py-10">Initialize New Architecture Vector</button>
               </div>
           </main>
        )}

        {activeTab === 'HISTORY' && (
           <div className="h-full p-24 overflow-y-auto custom-scrollbar animate-fade-in bg-[#050608]">
             <h2 className="text-8xl font-black italic text-white mb-20 tracking-tighter uppercase border-b border-white/5 pb-16">Archives</h2>
             {history.length === 0 ? <p className="text-slate-800 uppercase tracking-[1em] text-center py-56 italic">Database Offline...</p> : (
               <div className="grid grid-cols-1 gap-10 max-w-6xl mx-auto">
                 {history.map(item => (
                   <div key={item.id} className="glass p-16 rounded-[5rem] flex justify-between items-center group cursor-pointer hover:border-indigo-500/30 transition-all shadow-2xl" onClick={() => {setOutput(item.output); setActiveTab('BUILD');}}>
                     <div className="space-y-4">
                        <span className="text-indigo-500 font-black uppercase tracking-widest text-[11px] italic">{new Date(item.timestamp).toLocaleDateString()}</span>
                        <h4 className="text-4xl font-black text-white italic group-hover:text-indigo-400 transition-colors uppercase leading-tight">{item.input.high_level_goal?.substring(0, 50) || "App Synthesis Vector"}...</h4>
                     </div>
                     <Icons.Sparkles className="w-10 h-10 text-slate-800 group-hover:text-indigo-500 transition-all" />
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
};

export default App;