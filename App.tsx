
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PromptInput, PromptOutput, HistoryItem, UserStatus, MarketingKit, PlanType, WebhookEvent, ApiKey } from './types';
import { TextInput, TextArea, Select } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  testArchitectedPrompt, 
  magicFillMetaInputs, 
  generateVisualImage,
  generateMarketingKit,
  generateVideoTeaser,
  generateVoiceover
} from './services/geminiService';
import { backendService } from './services/backendService';

const STORAGE_KEY = 'architect_master_history_v2';
const USER_KEY = 'architect_user_status_v1';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'history' | 'dev'>('build');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showCheckout, setShowCheckout] = useState<{ plan: PlanType, price: number } | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Developer State
  const [webhookLogs, setWebhookLogs] = useState<WebhookEvent[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Marketing & Agency States
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [marketingKit, setMarketingKit] = useState<MarketingKit | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [activeKitTab, setActiveKitTab] = useState<'text' | 'video' | 'audio'>('text');

  // SaaS State
  const [user, setUser] = useState<UserStatus>({
    plan: "Starter",
    creditsRemaining: 450,
    totalCredits: 1000,
    stripeCustomerId: 'cus_demo_123'
  });

  const [simpleDesc, setSimpleDesc] = useState('');
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [generatedVisualUrl, setGeneratedVisualUrl] = useState<string | null>(null);

  // Playground
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<{role:'user'|'assistant', content:string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 2.0",
    high_level_goal: "",
    task_type: "writing",
    domain_context: "",
    user_persona: "",
    audience_persona: "",
    tone_style: "professional",
    output_format: "plain text",
    length_and_depth: "concise",
    reasoning_visibility: "hidden",
    language: "English",
    visual_inspiration_mode: true,
    brand: { voice: "Professional & Reliable", valueProp: "Industry-leading efficiency" }
  });

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) try { setUser(JSON.parse(savedUser)); } catch (e) {}

    // Load Dev Data
    backendService.getWebhookLogs().then(setWebhookLogs);
    backendService.getApiKeys().then(setApiKeys);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    if (name.startsWith('brand.')) {
      const field = name.split('.')[1];
      setForm(prev => ({ ...prev, brand: { ...prev.brand!, [field]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleMagicFill = async () => {
    if (!simpleDesc.trim()) return;
    setIsMagicFilling(true);
    try {
      const suggested = await magicFillMetaInputs(simpleDesc, form.language);
      setForm(prev => ({ ...prev, high_level_goal: simpleDesc, ...suggested }));
    } finally {
      setIsMagicFilling(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.high_level_goal.trim()) {
      setError("Goal is required.");
      return;
    }
    if (user.creditsRemaining < 50) {
      setShowPricing(true);
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedVisualUrl(null);
    setMarketingKit(null);
    try {
      const result = await generateArchitectPrompt(form);
      setOutput(result);
      setUser(prev => ({ ...prev, creditsRemaining: prev.creditsRemaining - 50 }));

      if (form.visual_inspiration_mode && result.VISUAL_INSPIRATION_PROMPT) {
        const url = await generateVisualImage(result.VISUAL_INSPIRATION_PROMPT);
        setGeneratedVisualUrl(url);
      }

      const newItem: HistoryItem = { 
        id: Math.random().toString(36).substring(2, 9), 
        timestamp: Date.now(), 
        input: { ...form }, 
        output: result 
      };
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      setTimeout(() => document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKit = async () => {
    if (!output?.FINAL_PROMPT) return;
    setIsGeneratingKit(true);
    try {
      const kit = await generateMarketingKit(output.FINAL_PROMPT, form.high_level_goal, form.language, form.brand);
      setMarketingKit(kit);
    } finally {
      setIsGeneratingKit(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!output?.VISUAL_INSPIRATION_PROMPT) return;
    if (user.plan === "Starter") { setShowPricing(true); return; }
    setIsGeneratingVideo(true);
    try {
      const videoUrl = await generateVideoTeaser(output.VISUAL_INSPIRATION_PROMPT);
      setMarketingKit(prev => prev ? ({ ...prev, video_url: videoUrl }) : null);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!marketingKit?.audio_script) return;
    setIsGeneratingAudio(true);
    try {
      const audioUrl = await generateVoiceover(marketingKit.audio_script);
      setMarketingKit(prev => prev ? ({ ...prev, audio_blob_url: audioUrl }) : null);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleRunTest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!testInput.trim() || !output?.FINAL_PROMPT || isTesting) return;
    const msg = testInput;
    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTesting(true);
    try {
      const res = await testArchitectedPrompt(output.FINAL_PROMPT, msg);
      setTestMessages(prev => [...prev, { role: 'assistant', content: res }]);
    } finally {
      setIsTesting(false);
    }
  };

  const handleStartCheckout = async (plan: PlanType, price: number) => {
    setIsRedirecting(true);
    try {
      const session = await backendService.createCheckoutSession(plan, price);
      // In a real app: window.location.href = session.url;
      setTimeout(() => {
        setIsRedirecting(false);
        setShowCheckout({ plan, price });
      }, 1200);
    } catch (e) {
      setError("Failed to create secure session.");
      setIsRedirecting(false);
    }
  };

  const simulatePayment = async () => {
    if (!showCheckout) return;
    setIsPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // BACKEND WORKFLOW:
    // 1. Stripe confirms payment.
    // 2. Stripe calls our Webhook.
    // 3. Our Webhook updates the database.
    const events = await backendService.triggerPaymentWebhook(showCheckout.plan, showCheckout.price, user);
    setWebhookLogs(prev => [...events, ...prev]);

    const creditBumps: Record<PlanType, number> = {
      Starter: 0,
      Architect: 5000,
      Agency: 50000
    };

    setUser(prev => ({
      ...prev,
      plan: showCheckout.plan,
      creditsRemaining: prev.creditsRemaining + creditBumps[showCheckout.plan],
      totalCredits: prev.totalCredits + creditBumps[showCheckout.plan]
    }));

    setIsPaying(false);
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setShowCheckout(null);
      setShowPricing(false);
    }, 2000);
  };

  const rotateKey = async (id: string) => {
    const updated = await backendService.rotateApiKey(id);
    setApiKeys([...updated]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    return history.filter(h => h.input.high_level_goal.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [history, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f1f5f9]">
      {/* Sidebar */}
      <div className="w-full lg:w-[380px] border-r border-slate-200 bg-white shadow-2xl flex flex-col h-screen overflow-hidden z-50">
        <header className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">A</div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Architect<span className="text-indigo-600">.io</span></h1>
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">{user.plan} Active</span>
              </div>
            </div>
            <button onClick={() => setShowManual(true)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-xl border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Neural Balance</span>
                <span className="text-[10px] font-black text-indigo-600">{user.creditsRemaining} / {user.totalCredits}</span>
              </div>
              <div className="h-2 w-full bg-indigo-200/50 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${(user.creditsRemaining / user.totalCredits) * 100}%` }}></div>
              </div>
              <button onClick={() => setShowPricing(true)} className="w-full mt-3 py-2 text-[8px] font-black text-indigo-700 uppercase tracking-widest bg-white border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Scale Plan & bull; Buy Credits</button>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('build')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'build' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Design</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Library</button>
            <button onClick={() => setActiveTab('dev')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dev' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Console</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {activeTab === 'build' ? (
            <>
              {/* Brand Identity Hub */}
              <section className="space-y-4">
                <div className="flex items-center justify-between"><h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Brand Identity Hub</h3><span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black rounded">PRO</span></div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                  <TextInput label="Brand Voice" name="brand.voice" value={form.brand?.voice} onChange={handleInputChange} placeholder="e.g. Minimalist, Bold, Witty" />
                  <TextInput label="Primary Value Prop" name="brand.valueProp" value={form.brand?.valueProp} onChange={handleInputChange} placeholder="e.g. Save 10 hours a week" />
                </div>
              </section>

              <section className="bg-slate-900 rounded-[2rem] p-5 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg><h3 className="text-[10px] font-black uppercase tracking-widest">Neural Magic Fill</h3></div>
                  <textarea value={simpleDesc} onChange={e => setSimpleDesc(e.target.value)} placeholder="What are you building today?" className="w-full bg-white/5 rounded-2xl border border-white/10 p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none min-h-[100px]" />
                  <button onClick={handleMagicFill} disabled={isMagicFilling || !simpleDesc.trim()} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all">
                    {isMagicFilling ? "Processing..." : "Sync Parameters"}
                  </button>
                </div>
              </section>

              <div className="space-y-6">
                <Select label="Model Architecture" name="target_AI" value={form.target_AI} onChange={handleInputChange}>
                  <option value="Gemini 2.0">Gemini 2.0 (Native Multimodal)</option>
                  <option value="ChatGPT o3">OpenAI ChatGPT o3</option>
                  <option value="Claude 3.5">Claude 3.5 (Sonnet)</option>
                </Select>
                <TextArea label="Master Objective" name="high_level_goal" value={form.high_level_goal} onChange={handleInputChange} />
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <TextInput label="Base Persona" name="user_persona" value={form.user_persona} onChange={handleInputChange} />
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Generate Concept Art</span>
                    <input type="checkbox" name="visual_inspiration_mode" checked={form.visual_inspiration_mode} onChange={handleInputChange} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'history' ? (
            <div className="space-y-4">
              <input type="text" placeholder="Filter masterpieces..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs" />
              {filteredHistory.map(h => (
                <div key={h.id} onClick={() => { setForm(h.input); setOutput(h.output); setActiveTab('build'); }} className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-600 cursor-pointer transition-all shadow-sm group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{h.input.high_level_goal}</p>
                  <span className="text-[8px] text-slate-400 uppercase font-black">{h.input.target_AI} &bull; {new Date(h.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
               {/* API Key Management */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Secure API Access</h3>
                  {apiKeys.map(k => (
                    <div key={k.id} className="p-4 bg-slate-900 rounded-xl border border-white/5 space-y-3">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-indigo-400 uppercase">{k.label}</span>
                          <button onClick={() => rotateKey(k.id)} className="text-[8px] font-black uppercase text-slate-500 hover:text-white transition-colors">Rotate</button>
                       </div>
                       <div className="flex gap-2">
                          <input readOnly value={k.key} className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-white/40" />
                          <button onClick={() => copyToClipboard(k.key)} className="px-2 py-1 bg-white/10 text-white rounded text-[9px] font-black uppercase">Copy</button>
                       </div>
                    </div>
                  ))}
               </section>

               {/* Webhook Log */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stripe Webhook Feed</h3>
                  <div className="space-y-2">
                     {webhookLogs.length === 0 && <p className="text-[9px] text-slate-500 italic text-center py-4">No events recorded...</p>}
                     {webhookLogs.map(log => (
                        <div key={log.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm space-y-1.5 animate-in slide-in-from-top-1">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-900 uppercase tracking-tighter">{log.type}</span>
                              <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                           </div>
                           <p className="text-[8px] font-mono text-slate-400 line-clamp-1">{JSON.stringify(log.payload)}</p>
                           <div className="flex justify-between text-[7px] font-black uppercase text-slate-300">
                              <span>ID: {log.id}</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3">
            {loading ? "Architecting..." : "Architect Master Prompt"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-14 relative" id="output-section">
        {output && !loading ? (
          <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Engine Deployment v3.1</span>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">The Master Blueprint</h2>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => copyToClipboard(output.FINAL_PROMPT)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white shadow-indigo-200'}`}>
                    {copied ? 'Blueprint Copied' : 'Copy Primary Prompt'}
                 </button>
              </div>
            </header>

            <section className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
               <div className="p-12"><div className="bg-slate-50 p-10 rounded-3xl border border-slate-200 text-slate-800 font-mono text-sm leading-relaxed whitespace-pre-wrap">{output.FINAL_PROMPT}</div></div>
            </section>

            {/* Growth Hub */}
            <section className="bg-slate-900 rounded-[3rem] p-10 md:p-16 shadow-3xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full"></div>
               <div className="relative z-10 flex flex-col gap-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3"><h2 className="text-4xl font-black tracking-tight leading-none">Growth Hub</h2><span className="px-2 py-1 bg-indigo-600 text-[10px] font-black rounded uppercase">Agency Mode</span></div>
                      <p className="text-slate-400 text-sm font-medium">Generate high-conversion visual and audio assets for your new product.</p>
                    </div>
                    {!marketingKit ? (
                       <button onClick={handleGenerateKit} disabled={isGeneratingKit} className="px-10 py-5 bg-white text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-900/50 hover:bg-slate-100 transition-all flex items-center gap-3">
                          {isGeneratingKit ? "Synthesizing Kit..." : "Generate GTM Suite"}
                       </button>
                    ) : (
                      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button onClick={() => setActiveKitTab('text')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeKitTab === 'text' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Strategy</button>
                        <button onClick={() => setActiveKitTab('video')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeKitTab === 'video' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Video Ad</button>
                        <button onClick={() => setActiveKitTab('audio')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeKitTab === 'audio' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Audio Promo</button>
                      </div>
                    )}
                  </div>

                  {marketingKit && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {activeKitTab === 'text' && (
                        <div className="grid md:grid-cols-2 gap-10">
                           <div className="bg-white/5 rounded-3xl p-10 border border-white/10 space-y-6">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Launch Socials</h3>
                              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{marketingKit.social_ads}</div>
                           </div>
                           <div className="bg-white/5 rounded-3xl p-10 border border-white/10 space-y-6">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Onboarding Emails</h3>
                              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{marketingKit.email_sequence}</div>
                           </div>
                        </div>
                      )}

                      {activeKitTab === 'video' && (
                        <div className="flex flex-col items-center gap-10">
                          <div className="w-full max-w-4xl aspect-video bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden flex items-center justify-center relative group">
                            {marketingKit.video_url ? (
                              <video src={marketingKit.video_url} controls className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/20"><svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                <div className="space-y-2">
                                  <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Cinematic Teaser Render</p>
                                  <p className="text-slate-500 text-[10px] uppercase font-bold">Requires Agency Plan &bull; 500 Credits</p>
                                </div>
                                <button onClick={handleGenerateVideo} disabled={isGeneratingVideo} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
                                  {isGeneratingVideo ? "Rendering Cinematic..." : "Render 5s Video Ad"}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="max-w-2xl bg-white/5 p-8 rounded-3xl border border-white/10"><p className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Veo Director's Script</p><p className="text-xs text-slate-300 italic">"{marketingKit.video_script}"</p></div>
                        </div>
                      )}

                      {activeKitTab === 'audio' && (
                        <div className="flex flex-col items-center gap-10">
                          <div className="w-full max-w-2xl bg-white/5 p-12 rounded-[2.5rem] border border-white/10 text-center space-y-8">
                             <div className="h-16 flex items-center justify-center gap-2">
                                {[...Array(20)].map((_, i) => <div key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>)}
                             </div>
                             {marketingKit.audio_blob_url ? (
                               <audio src={marketingKit.audio_blob_url} controls className="mx-auto" />
                             ) : (
                               <button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="px-10 py-5 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-500 transition-all">
                                 {isGeneratingAudio ? "Synthesizing Voice..." : "Generate AI Voiceover"}
                               </button>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
               </div>
            </section>

            {/* Simulation Playground */}
            <section className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-slate-100 flex flex-col h-[700px]">
              <div className="flex items-center gap-4 mb-10"><span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Neural Simulator</span><div className="h-px flex-1 bg-slate-100"></div></div>
              <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar mb-10 pr-4">
                {testMessages.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400 gap-4"><svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg><p className="text-[10px] font-black uppercase tracking-widest">Waiting for simulation input...</p></div>}
                {testMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-8 rounded-[2rem] text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'}`}>{m.content}</div>
                  </div>
                ))}
                {isTesting && <div className="flex justify-start"><div className="p-6 bg-slate-50 rounded-3xl flex items-center gap-3 animate-pulse"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div></div><span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Architect thinking...</span></div></div>}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleRunTest} className="flex gap-4 bg-slate-100 p-6 rounded-[2.5rem] border border-slate-200">
                <textarea value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="Type a message to test the architected prompt..." className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 text-sm py-2 resize-none" rows={1} />
                <button type="submit" disabled={!testInput.trim() || isTesting} className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-all"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3.4 20.4l17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" /></svg></button>
              </form>
            </section>
          </div>
        ) : loading ? (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="relative">
                <div className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-[3rem] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 bg-indigo-600 rounded-full animate-ping"></div></div>
             </div>
             <p className="mt-12 text-2xl font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse text-center px-6">Synthesizing Blueprint Architecture...</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 max-w-6xl mx-auto">
             <div className="text-center space-y-12 pb-20">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-100/50">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707z" /></svg>
                  Revolutionize your LLM Workflow
                </div>
                <h1 className="text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] max-w-4xl">Prompting is the new coding.</h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">The only enterprise-grade suite for architecting master prompts and automated marketing assets.</p>
                <div className="flex justify-center gap-4 pt-4">
                  <button onClick={() => setActiveTab('build')} className="px-12 py-6 bg-indigo-600 text-white font-black uppercase text-sm tracking-[0.2em] rounded-3xl shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">Start Architecting</button>
                  <button onClick={() => setShowPricing(true)} className="px-12 py-6 bg-white text-slate-900 border border-slate-200 font-black uppercase text-sm tracking-[0.2em] rounded-3xl hover:bg-slate-50 transition-all">View Pricing</button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Redirecting Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <p className="mt-8 text-sm font-black text-slate-900 uppercase tracking-widest">Redirecting to Stripe Secure Checkout...</p>
           <p className="mt-2 text-[10px] text-slate-400 font-medium">Please do not close this window</p>
        </div>
      )}

      {/* Modern Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-6xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500 max-h-[95vh]">
              <button onClick={() => setShowPricing(false)} className="absolute top-10 right-10 p-5 bg-slate-100 rounded-3xl text-slate-400 hover:text-red-500 hover:bg-white transition-all shadow-sm z-10"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
              
              <div className="p-16 overflow-y-auto">
                 <div className="text-center mb-16 space-y-4">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight">Scale your Agency.</h2>
                    <p className="text-lg text-slate-500 font-medium">Choose the plan that fits your production volume.</p>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="p-12 bg-slate-50 rounded-[3rem] border border-slate-200 flex flex-col justify-between">
                       <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Plan</span>
                          <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">Architect Pro</h3>
                          <div className="mt-6 flex items-baseline gap-2">
                             <span className="text-5xl font-black text-slate-900">$29</span>
                             <span className="text-sm font-bold text-slate-400 uppercase">/ month</span>
                          </div>
                          <ul className="mt-10 space-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">
                             <li>&bull; 5,000 Neural Credits</li>
                             <li>&bull; Full Strategy Kit</li>
                             <li>&bull; Priority GPT-4 Support</li>
                          </ul>
                       </div>
                       <button onClick={() => handleStartCheckout('Architect', 29)} className="w-full mt-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Select Plan</button>
                    </div>

                    <div className="p-12 bg-indigo-600 rounded-[3rem] text-white flex flex-col justify-between shadow-3xl shadow-indigo-600/30 transform hover:scale-[1.02] transition-transform">
                       <div>
                          <div className="flex justify-between items-start">
                             <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Enterprise Tier</span>
                             <div className="px-3 py-1 bg-white text-indigo-600 text-[8px] font-black rounded-full uppercase">Popular</div>
                          </div>
                          <h3 className="text-2xl font-black mt-2 tracking-tight">Agency Pro</h3>
                          <div className="mt-6 flex items-baseline gap-2">
                             <span className="text-5xl font-black">$99</span>
                             <span className="text-sm font-bold text-indigo-200 uppercase">/ month</span>
                          </div>
                          <ul className="mt-10 space-y-4 text-xs font-bold text-indigo-100 uppercase tracking-widest leading-loose">
                             <li>&bull; 50,000 Neural Credits</li>
                             <li>&bull; Video & Audio Renders</li>
                             <li>&bull; White-label Exports</li>
                          </ul>
                       </div>
                       <button onClick={() => handleStartCheckout('Agency', 99)} className="w-full mt-12 py-5 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-50 transition-all">Select Agency</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Simulated Stripe Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
             {paymentSuccess ? (
               <div className="p-16 text-center space-y-6">
                 <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <h2 className="text-3xl font-black text-slate-900">Payment Successful</h2>
                 <p className="text-slate-500 font-medium text-xs uppercase font-black tracking-widest">Webhook Verified: invoice.paid</p>
               </div>
             ) : (
               <>
                 <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
                       <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Architect.io Secure Checkout</span>
                    </div>
                    <button onClick={() => setShowCheckout(null)} className="text-slate-400 hover:text-slate-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                 </header>
                 <div className="p-10 space-y-8">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Details</p>
                       <div className="flex justify-between items-end">
                          <h3 className="text-xl font-black text-slate-900">{showCheckout.plan} Tier</h3>
                          <p className="text-xl font-black text-slate-900">${showCheckout.price}.00</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Card Information</label>
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
                             <input type="text" placeholder="Card number" className="bg-transparent text-sm font-mono focus:outline-none w-full" defaultValue="4242 4242 4242 4242" />
                             <div className="flex gap-4 border-t border-slate-200 pt-4">
                                <input type="text" placeholder="MM / YY" className="bg-transparent text-sm focus:outline-none w-1/2" defaultValue="12 / 26" />
                                <input type="text" placeholder="CVC" className="bg-transparent text-sm focus:outline-none w-1/2" defaultValue="123" />
                             </div>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={simulatePayment} 
                      disabled={isPaying}
                      className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:bg-indigo-700 active:scale-[0.98]"
                    >
                       {isPaying ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : `Complete Purchase`}
                    </button>
                    <div className="flex items-center justify-center gap-2 opacity-30">
                       <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
                       <span className="text-[10px] font-black uppercase tracking-widest">TLS 1.3 Encryption Active</span>
                    </div>
                 </div>
               </>
             )}
          </div>
        </div>
      )}

      {/* Manual Modal */}
      {showManual && (
        <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
             <header className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Architect Academy</h2>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Mastering Deployment Cycles</p>
               </div>
               <button onClick={() => setShowManual(false)} className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </header>
             <div className="p-10 space-y-8">
                <section className="space-y-4">
                   <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-3"><div className="w-6 h-6 bg-indigo-600 rounded-lg text-white flex items-center justify-center text-[10px] font-bold">01</div>Credits Logic</h3>
                   <p className="text-sm text-slate-500 font-medium leading-relaxed">Blueprint generation costs **50 credits**. Purchase a subscription to top up your Neural Balance instantly.</p>
                </section>
                <div className="p-6 bg-indigo-600 rounded-3xl text-white flex items-center gap-6 shadow-2xl shadow-indigo-100">
                   <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest">Pro Tip</p>
                     <p className="text-xs font-medium italic">"Check the Console tab to verify real-time Stripe webhooks and rotate API keys."</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
