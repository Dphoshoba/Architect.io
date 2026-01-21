import React, { useState, useEffect, useRef } from 'react';
import { PromptInput, PromptOutput, MarketingKit, TargetAI, UserStatus, HistoryItem, MastermindSuggestionCategory, InterviewQuestion } from './types';
import { TextArea, Select, TextInput } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  generateVisualImage, 
  generateMastermindSuggestions,
  generateInterviewQuestions
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
  Keyboard: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Bank: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-12h1m-1 4h1m-1 4h1" /></svg>,
  Layout: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 9h16m-10 0v10" /></svg>
};

const MASTERMIND_COACH_INSIGHTS = {
  'Website': ["DNA matters.", "Layout is conversion.", "Aesthetic is brand.", "Type is voice."],
  'App': ["Purpose first.", "Persona is protagonist.", "Platform is boundary.", "V1 is MVP.", "Auth is trust.", "Features are heart.", "UX is journey."],
  'SaaS': ["Category defines logic.", "Users define flow.", "Pain point is value.", "Industry sets rules.", "Monetization is scale."],
  'Finance': ["Accuracy is critical.", "Tax rules change logic.", "Audit logs are a MUST.", "Roles ensure control.", "Regions dictate VAT/GST.", "Ledger must be immutable."],
  'Professional': ["Domain sets boundary.", "Expertise is density.", "Protocol is legal.", "Compliance is mandatory."],
  'Simple': ["Raw directive entry.", "Architect will synthesize."]
};

const SHARDS = {
  saas_category: [
    { label: "Sales & CRM", desc: "Pipelines, lead management & communication." },
    { label: "Marketing", desc: "Automation, campaigns & segmentation." },
    { label: "Customer Support", desc: "Ticketing, helpdesk & omnichannel care." },
    { label: "Ops & ERP", desc: "Inventory, supply chain & order logic." },
    { label: "HR & Payroll", desc: "Recruiting, onboarding & compensation." },
    { label: "Analytics & BI", desc: "Dashboards, reporting & data visualization." },
    { label: "DevTools", desc: "CI/CD, monitoring & low-code logic." },
    { label: "Security & IT", desc: "Compliance, IAM & endpoint management." }
  ],
  fin_domain: [
    { label: "Accounting", desc: "General ledger & chart of accounts." },
    { label: "Invoicing", desc: "Billing & customer payment flows." },
    { label: "Expenses", desc: "Employee reimbursements & tracking." },
    { label: "Tax Suite", desc: "VAT, GST, & income tax prep logic." }
  ],
  fin_users: [
    { label: "Founders", desc: "Quick oversight & cashflow." },
    { label: "Accountants", desc: "Deep compliance & audit tools." },
    { label: "Finance Team", desc: "Enterprise-grade controls." }
  ],
  app_platform: [
    { label: "Responsive Web", desc: "Cross-device browser access." },
    { label: "iOS / Android", desc: "Native smartphone application." }
  ],
  tone_style: [
    { label: "Professional", desc: "Serious, academic, boardroom tone." },
    { label: "Empathetic", desc: "Helpful, clear, non-intimidating." }
  ],
  saas_monetization: [
    { label: "Tiered Subscription", desc: "Standard SaaS pricing levels." },
    { label: "Usage-based", desc: "Pay for what you consume." },
    { label: "Freemium", desc: "Basic free tier, paid upgrades." }
  ]
};

const GUIDED_FLOWS = {
  'SaaS': { title: 'SAAS ARCHITECT', icon: Icons.Layout, questions: [
    { key: 'saas_category', label: 'Business Area' },
    { key: 'user_persona', label: 'Primary User' },
    { key: 'saas_industry', label: 'Vertical / Industry' },
    { key: 'saas_monetization', label: 'Monetization Plan' },
    { key: 'high_level_goal', label: 'Core Pain Point' },
  ]},
  'Finance': { title: 'FINANCE ARCHITECT', icon: Icons.Bank, questions: [
    { key: 'fin_domain', label: 'Finance Domain' },
    { key: 'fin_users', label: 'Primary User' },
    { key: 'fin_region', label: 'Region & Currency' },
    { key: 'high_level_goal', label: 'Core Workflow' },
  ]},
  'Website': { title: 'WEBSITE CONSTRUCTOR', icon: Icons.Globe, questions: [
    { key: 'web_type', label: 'Platform DNA' },
    { key: 'tone_style', label: 'Tone/Vibe' },
    { key: 'high_level_goal', label: 'Objective' },
  ]},
  'App': { title: 'APP ARCHITECT', icon: Icons.AppWindow, questions: [
    { key: 'high_level_goal', label: 'App Purpose' },
    { key: 'user_persona', label: 'Primary User' },
    { key: 'app_platform', label: 'Platform' },
  ]},
  'Simple': { title: 'SIMPLE PROMPT', icon: Icons.Keyboard, questions: [
    { key: 'high_level_goal', label: 'Direct Command' }
  ]}
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY' | 'ACCOUNT'>('BUILD');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [isInterviewing, setIsInterviewing] = useState(false);

  const [mastermindSuggestions, setMastermindSuggestions] = useState<MastermindSuggestionCategory[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", high_level_goal: "", task_type: "Synthesis", domain_context: "",
    user_persona: "Lead Architect", tone_style: "Professional", output_format: "Markdown",
    length_and_depth: "Detailed", reasoning_visibility: "brief", language: "English",
    visual_inspiration_mode: true
  });
  
  const [guidedState, setGuidedState] = useState({ category: null as string | null, index: 0 });

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
    if (guidedState.category && activeTab === 'BUILD' && !isReviewing && !isInterviewing) {
        const flow = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS];
        const question = flow.questions[guidedState.index];
        speak(`${question.label}.`);
    }
  }, [guidedState.index, guidedState.category, activeTab, isReviewing, isInterviewing]);

  const toggleShard = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCopyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard.");
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

  const enterInterview = async () => {
    if (guidedState.category === 'Simple' && !form.high_level_goal) return;
    setLoading(true);
    try {
      const q = await generateInterviewQuestions(form);
      setInterviewQuestions(q);
      setIsInterviewing(true);
      speak("Architecture review requested. Please clarify these details.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMatrix = async () => {
    setLoading(true);
    try {
      const refinedGoal = `
        ${form.high_level_goal}
        INTERVIEW ANSWERS:
        ${Object.entries(interviewAnswers).map(([id, ans]) => `- ${ans}`).join('\n')}
      `;
      const res = await generateMastermindSuggestions({ ...form, high_level_goal: refinedGoal });
      setMastermindSuggestions(res);
      setIsReviewing(true);
      setIsInterviewing(false);
      speak("Strategy Room active. Final refinements required.");
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
      const refinements = Object.entries(selectedSuggestions).map(([cat, val]) => `[${cat}]: ${val}`).join('\n');
      const finalGoal = `
        PRIMARY OBJECTIVE: ${form.high_level_goal}
        VECTOR: ${guidedState.category}
        REFINEMENTS: ${refinements}
        DISCOVERY ANSWERS: ${Object.values(interviewAnswers).join(' ')}
      `;

      const res = await generateArchitectPrompt({ ...form, high_level_goal: finalGoal });
      setOutput(res);

      const visualUrl = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || finalGoal);
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
    return insights[step] || "Define logic shard.";
  };

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-slate-100 overflow-hidden">
      <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-[#050608]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-10">
          <div className="flex flex-col cursor-pointer" onClick={() => {setOutput(null); setGuidedState(p => ({...p, category: null, index: 0})); setIsReviewing(false); setIsInterviewing(false);}}>
            <h1 className="text-2xl font-black italic uppercase">ARCHITECT<span className="text-indigo-500">.IO</span></h1>
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
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center animate-fade-in backdrop-blur-3xl">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8" />
            <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-xs">Synthesis In Progress...</p>
          </div>
        )}

        {/* STEP 1: VECTOR SELECTION */}
        {activeTab === 'BUILD' && !guidedState.category && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in">
            <h2 className="text-[5vw] font-black italic uppercase text-white mb-20 tracking-tighter">Select Synthesis Vector</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 w-full max-w-7xl px-10">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button key={key} onClick={() => setGuidedState(p => ({ ...p, category: key, index: 0 }))} className="group glass rounded-[3rem] p-12 flex flex-col items-center transition-all hover:scale-105 hover:border-indigo-500/50 shadow-2xl">
                  <flow.icon className="w-14 h-14 text-indigo-400 mb-8 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase text-white italic text-center leading-tight">{flow.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: GUIDED DISCOVERY / SHARDS */}
        {activeTab === 'BUILD' && guidedState.category && !isInterviewing && !isReviewing && !output && (
          <div className="h-full flex flex-col p-16 overflow-y-auto custom-scrollbar animate-fade-in bg-[#050608]">
             <div className="max-w-7xl mx-auto w-full space-y-12">
              <button onClick={() => setGuidedState(p => ({ ...p, category: null, index: 0 }))} className="flex items-center gap-3 text-[11px] font-black text-slate-600 hover:text-white uppercase tracking-widest italic group">
                <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Exit Vector
              </button>
              <div className="max-w-5xl mx-auto p-12 glass rounded-[3rem] flex gap-10 shadow-inner border-indigo-500/10">
                <Icons.Sparkles className="w-14 h-14 text-indigo-400 flex-shrink-0 animate-pulse" />
                <p className="text-2xl text-slate-300 font-semibold italic leading-relaxed uppercase tracking-wider">"{getCoachingInsight(guidedState.category || '', guidedState.index)}"</p>
              </div>
              <h2 className="text-[6vw] font-black italic uppercase text-white text-center tracking-tighter leading-none">{GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index].label}</h2>
              {(() => {
                const q = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index];
                const options = (SHARDS as any)[q.key] || [];
                const isTextArea = q.key === 'high_level_goal' || q.key === 'saas_industry' || q.key === 'fin_region';
                return isTextArea ? (
                  <TextArea label={q.label} value={(form as any)[q.key] || ""} onChange={e => setForm(p => ({ ...p, [q.key]: e.target.value }))} className="max-w-5xl mx-auto text-2xl py-12 px-10 rounded-[4rem] min-h-[350px]" />
                ) : options.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-10">
                    {options.map((opt: any) => (
                      <button key={opt.label} onClick={() => toggleShard(q.key, opt.label)} className={`p-10 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center gap-3 ${(form as any)[q.key] === opt.label ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl' : 'bg-[#11141d]/80 border-white/5 text-slate-500'}`}>
                        <span className="text-[14px] font-black uppercase text-center">{opt.label}</span>
                        <span className="text-[9px] opacity-50 uppercase text-center leading-tight px-4">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                ) : <TextInput value={(form as any)[q.key] || ""} onChange={e => setForm(p => ({ ...p, [q.key]: e.target.value }))} label={q.label} className="max-w-4xl mx-auto" />;
              })()}
              <div className="flex flex-col items-center pt-24">
                 <button onClick={guidedState.index < GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions.length - 1 ? () => setGuidedState(p => ({ ...p, index: p.index + 1 })) : enterInterview} className="px-36 py-10 bg-white text-black font-black uppercase rounded-full shadow-2xl tracking-[0.6em] italic text-sm transition-transform hover:scale-105">Next Phase</button>
              </div>
             </div>
          </div>
        )}

        {/* STEP 3: INTERVIEW (AskUserQuestion cycle) */}
        {activeTab === 'BUILD' && isInterviewing && (
          <div className="h-full flex flex-col p-16 overflow-y-auto custom-scrollbar animate-fade-in bg-[#050608]">
             <div className="max-w-4xl mx-auto w-full space-y-16">
                <div className="text-center">
                  <h2 className="text-7xl font-black italic uppercase text-white tracking-tighter">Architecture Discovery</h2>
                  <p className="text-indigo-500 font-black uppercase tracking-widest mt-4">Clarify missing details</p>
                </div>
                {interviewQuestions.map(q => (
                  <div key={q.id} className="glass p-10 rounded-[3rem] space-y-6">
                    <h4 className="text-xl font-bold text-white italic">{q.question}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-widest leading-relaxed">{q.context}</p>
                    <TextArea value={interviewAnswers[q.id] || ""} onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))} placeholder="Provide technical or business detail..." />
                  </div>
                ))}
                <button onClick={handleAnalyzeMatrix} className="w-full py-10 bg-indigo-600 text-white font-black uppercase rounded-full shadow-2xl tracking-[0.5em] italic transition-transform hover:scale-105">Analyze Final Matrix</button>
             </div>
          </div>
        )}

        {/* STEP 4: STRATEGY ROOM (Mastermind Refinements) */}
        {activeTab === 'BUILD' && isReviewing && (
          <div className="h-full flex flex-col p-16 overflow-y-auto custom-scrollbar animate-fade-in bg-[#050608]">
            <div className="max-w-7xl mx-auto w-full space-y-16">
               <div className="text-center">
                  <h2 className="text-7xl font-black italic uppercase text-white tracking-tighter">Strategy Room</h2>
                  <p className="text-indigo-500 font-black uppercase tracking-widest mt-4">Refine architectural DNA</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {mastermindSuggestions.map((cat, i) => (
                    <div key={i} className="glass p-10 rounded-[3rem] space-y-8">
                      <h4 className="text-[12px] font-black uppercase text-indigo-400 tracking-widest italic">{cat.category}</h4>
                      <div className="flex flex-col gap-3">
                         {cat.options.map((opt, j) => (
                           <button key={j} onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} className={`p-6 rounded-2xl text-left border transition-all ${selectedSuggestions[cat.category] === opt.technical_value ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-slate-400'}`}>
                              <span className="text-[12px] font-black uppercase block">{opt.label}</span>
                              <p className="text-[9px] opacity-60 font-medium uppercase mt-1 leading-tight">{opt.description}</p>
                           </button>
                         ))}
                      </div>
                    </div>
                  ))}
               </div>
               <button onClick={handleExecute} className="w-full max-w-4xl mx-auto py-10 bg-white text-black font-black uppercase rounded-full block shadow-2xl tracking-[0.5em] italic transition-transform hover:scale-105">Synthesize Final Blueprint</button>
            </div>
          </div>
        )}

        {/* STEP 5: FINAL OUTPUT */}
        {activeTab === 'BUILD' && output && (
           <main className="absolute inset-0 z-[200] p-16 overflow-y-auto custom-scrollbar bg-[#050608] animate-fade-in">
               <div className="max-w-7xl mx-auto pb-48 space-y-32">
                   <div className="flex justify-between items-center border-b border-white/10 pb-12">
                      <div className="flex items-center gap-6">
                         <button onClick={() => {setOutput(null); setIsInterviewing(false); setIsReviewing(false);}} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Icons.ArrowLeft className="w-6 h-6 text-slate-400" /></button>
                         <h3 className="text-7xl font-black italic uppercase text-white tracking-tighter">Synthesis</h3>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => handleCopyText(output.FINAL_PROMPT)} className="flex items-center gap-3 px-10 py-5 bg-white text-black font-black uppercase text-[11px] rounded-full hover:bg-slate-200 transition-all shadow-xl tracking-[0.2em] italic"><Icons.Copy className="w-5 h-5" /> Copy Specs</button>
                        <button onClick={() => handleDownload(output.FINAL_PROMPT, 'implementation-prompt.txt')} className="flex items-center gap-3 px-10 py-5 bg-white/5 text-white font-black uppercase text-[11px] rounded-full border border-white/10 hover:bg-white/10 transition-all tracking-[0.2em] italic"><Icons.Download className="w-5 h-5" /> Download</button>
                      </div>
                   </div>
                   
                   {output.APP_BLUEPRINT && (
                     <div className="space-y-10 animate-fade-in">
                        <div className="flex justify-between items-end pl-4">
                           <h4 className="text-indigo-400 font-black uppercase tracking-[1em] italic leading-none">APP BLUEPRINT</h4>
                           <div className="flex gap-4">
                              <button onClick={() => handleCopyText(output.APP_BLUEPRINT || '')} className="p-2 text-slate-500 hover:text-white" title="Copy"><Icons.Copy className="w-5 h-5" /></button>
                              <button onClick={() => handleDownload(output.APP_BLUEPRINT || '', 'blueprint.txt')} className="p-2 text-slate-500 hover:text-white" title="Download"><Icons.Download className="w-5 h-5" /></button>
                           </div>
                        </div>
                        <div className="bg-[#0e0f14] border border-white/5 p-20 rounded-[5rem] text-slate-300 font-sans text-xl leading-relaxed whitespace-pre-wrap shadow-2xl relative">
                           {output.APP_BLUEPRINT}
                        </div>
                     </div>
                   )}

                   <div className="space-y-10">
                      <div className="flex justify-between items-end pl-4">
                        <h4 className="text-indigo-400 font-black uppercase tracking-[1em] italic leading-none text-sm">IMPLEMENTATION PROMPT</h4>
                        <div className="flex gap-4">
                            <button onClick={() => handleCopyText(output.FINAL_PROMPT)} className="p-2 text-slate-500 hover:text-white" title="Copy"><Icons.Copy className="w-5 h-5" /></button>
                            <button onClick={() => handleDownload(output.FINAL_PROMPT, 'prompt.txt')} className="p-2 text-slate-500 hover:text-white" title="Download"><Icons.Download className="w-5 h-5" /></button>
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
                   
                   <button onClick={() => {setOutput(null); setIsReviewing(false); setIsInterviewing(false); setGuidedState(p => ({...p, category: null, index: 0}));}} className="text-slate-500 font-black uppercase tracking-[1.5em] italic mx-auto block hover:text-white transition-all py-10">Start New Vector</button>
               </div>
           </main>
        )}

        {activeTab === 'HISTORY' && (
           <div className="h-full p-24 overflow-y-auto custom-scrollbar animate-fade-in bg-[#050608]">
             <h2 className="text-8xl font-black italic text-white mb-20 tracking-tighter uppercase">Archives</h2>
             {history.length === 0 ? <p className="text-slate-800 uppercase tracking-[1em] text-center py-56 italic">Archives Standby...</p> : (
               <div className="grid grid-cols-1 gap-10 max-w-6xl mx-auto">
                 {history.map(item => (
                   <div key={item.id} className="glass p-16 rounded-[5rem] flex justify-between items-center group cursor-pointer hover:border-indigo-500/30 transition-all shadow-2xl" onClick={() => {setOutput(item.output); setActiveTab('BUILD');}}>
                     <h4 className="text-4xl font-black text-white italic group-hover:text-indigo-400 transition-colors uppercase">{item.input.high_level_goal?.substring(0, 50) || "Synthesis Vector"}...</h4>
                     <span className="text-indigo-500 font-black uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
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
