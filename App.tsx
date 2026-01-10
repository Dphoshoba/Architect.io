
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PromptInput, PromptOutput, MarketingKit, UserStatus, HistoryItem, WebhookEvent } from './types';
import { TextInput, TextArea, Select } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  testArchitectedPrompt, 
  magicFillMetaInputs, 
  generateVisualImage,
  generateMarketingKit
} from './services/geminiService';
import { backendService } from './services/backendService';

const App: React.FC = () => {
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'build' | 'history' | 'dev'>('build');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- DATA VAULT ---
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    plan: 'Architect',
    creditsRemaining: 1000,
    totalCredits: 1000
  });
  const [logs, setLogs] = useState<WebhookEvent[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  // --- FORM STATE ---
  const [simpleDesc, setSimpleDesc] = useState('');
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [generatedVisualUrl, setGeneratedVisualUrl] = useState<string | null>(null);
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [marketingKit, setMarketingKit] = useState<MarketingKit | null>(null);
  const [showPlayground, setShowPlayground] = useState(false);

  // --- PLAYGROUND STATE ---
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<{role:'user'|'assistant', content:string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 2.0",
    high_level_goal: "",
    task_type: "Reasoning",
    domain_context: "",
    user_persona: "",
    audience_persona: "",
    tone_style: "Professional",
    output_format: "Markdown",
    length_and_depth: "Detailed",
    reasoning_visibility: "brief",
    language: "English",
    visual_inspiration_mode: true,
    few_shot_examples: "",
    constraints_and_pitfalls: "",
    static_resources: ""
  });

  // --- BACKEND SYNC ---
  useEffect(() => {
    const savedVault = localStorage.getItem('architect_vault_v3');
    if (savedVault) setHistory(JSON.parse(savedVault));

    const fetchBackendData = async () => {
      try {
        const [backendLogs, keys] = await Promise.all([
          backendService.getWebhookLogs(),
          backendService.getApiKeys()
        ]);
        setLogs(backendLogs);
        setApiKeys(keys);
      } catch (e) {
        console.warn("Backend poll failed - continuing in standalone mode.");
      }
    };

    fetchBackendData();
    const interval = setInterval(fetchBackendData, 15000); 
    return () => clearInterval(interval);
  }, []);

  const saveToVault = (newItem: HistoryItem) => {
    const updated = [newItem, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('architect_vault_v3', JSON.stringify(updated));
  };

  // --- ACTIONS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpgrade = async () => {
    setLoading(true);
    const result = await backendService.createCheckoutSession('Architect', 49);
    if (result.url && result.url !== '#error') {
      window.location.href = result.url;
    } else {
      setError("Payment system offline. This is likely a 'Secret Key' mismatch on your Render backend. Please verify STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.");
      setLoading(false);
    }
  };

  const handleMagicFill = async () => {
    if (!simpleDesc.trim()) return;
    setIsMagicFilling(true);
    try {
      const suggested = await magicFillMetaInputs(simpleDesc, form.language);
      setForm(prev => ({ ...prev, high_level_goal: simpleDesc, ...suggested }));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsMagicFilling(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.high_level_goal.trim()) {
      setError("Define your High-Level Goal to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedVisualUrl(null);
    setMarketingKit(null);
    setTestMessages([]);

    try {
      const result = await generateArchitectPrompt(form);
      setOutput(result);

      const newItem: HistoryItem = {
        id: `arch_${Date.now()}`,
        timestamp: Date.now(),
        input: { ...form },
        output: { ...result }
      };
      saveToVault(newItem);

      setUserStatus(prev => ({ ...prev, creditsRemaining: prev.creditsRemaining - 1 }));

      if (form.visual_inspiration_mode && result.VISUAL_INSPIRATION_PROMPT) {
        generateVisualImage(result.VISUAL_INSPIRATION_PROMPT).then(setGeneratedVisualUrl).catch(console.error);
      }
    } catch (err: any) {
      setError(err.message || "Synthesis failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKit = async () => {
    if (!output?.FINAL_PROMPT) return;
    setIsGeneratingKit(true);
    try {
      const kit = await generateMarketingKit(output.FINAL_PROMPT, form.high_level_goal, form.language);
      setMarketingKit(kit);
    } catch (e) {
      setError("Marketing Kit generation failed.");
    } finally {
      setIsGeneratingKit(false);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    return history.filter(item => 
      item.input.high_level_goal.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-slate-100 font-sans selection:bg-indigo-500/50">
      {/* HEADER */}
      <header className="flex-none h-16 border-b border-white/5 bg-[#050608]/90 backdrop-blur-xl flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-white uppercase">Prompt Architect</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">V2.0 Master Suite</p>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <nav className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {(['build', 'history', 'dev'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-indigo-400 font-mono tracking-tighter">PROJECTED_CREDITS: {userStatus.creditsRemaining}</span>
             </div>
          </div>
          <button onClick={handleUpgrade} className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Upgrade
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 lg:p-10">
            
            {activeTab === 'build' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* CONFIGURATION PANEL */}
                <div className="lg:col-span-4 space-y-6">
                  <section className="bg-[#0e1014] border border-white/5 rounded-3xl p-6 shadow-2xl animate-fade-in">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                        <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Architectural Seed</h2>
                        <span className="text-[9px] font-mono text-slate-700 italic">Core Processor</span>
                      </div>
                      <TextArea 
                        label="Task Description" 
                        placeholder="e.g., Build a robust master prompt template for generating email campaigns for a new AI productivity SaaS."
                        value={simpleDesc}
                        onChange={(e) => setSimpleDesc(e.target.value)}
                        className="bg-black/50 border-white/10 text-white placeholder:text-slate-600 text-xs font-medium min-h-[100px]"
                      />
                      <button 
                        onClick={handleMagicFill}
                        disabled={isMagicFilling || !simpleDesc}
                        className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition-all disabled:opacity-30"
                      >
                        {isMagicFilling ? "Inferring Parameters..." : "✨ Auto-Fill Blueprint"}
                      </button>
                    </div>

                    <div className="mt-8 space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                        <Select label="Target AI" name="target_AI" value={form.target_AI} onChange={handleInputChange}>
                          <option value="Gemini 2.0">Gemini 2.0</option>
                          <option value="ChatGPT o3">ChatGPT o3</option>
                          <option value="Claude 3.5">Claude 3.5</option>
                          <option value="Llama 3.1">Llama 3.1</option>
                          <option value="Generic">Generic</option>
                        </Select>
                        <Select label="Reasoning" name="reasoning_visibility" value={form.reasoning_visibility} onChange={handleInputChange}>
                          <option value="hidden">Hidden</option>
                          <option value="brief">Brief</option>
                          <option value="detailed">Detailed</option>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <TextInput label="Goal Summary" name="high_level_goal" value={form.high_level_goal} onChange={handleInputChange} placeholder="Strategic outcome..." />
                        <TextInput label="User Persona" name="user_persona" value={form.user_persona} onChange={handleInputChange} placeholder="Who are you?" />
                        <TextInput label="Audience Persona" name="audience_persona" value={form.audience_persona} onChange={handleInputChange} placeholder="Who is it for?" />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <TextInput label="Tone" name="tone_style" value={form.tone_style} onChange={handleInputChange} />
                          <TextInput label="Depth" name="length_and_depth" value={form.length_and_depth} onChange={handleInputChange} />
                        </div>

                        <TextArea label="Context & Constraints" name="constraints_and_pitfalls" value={form.constraints_and_pitfalls} onChange={handleInputChange} rows={3} placeholder="Avoid hype, focus on real outcomes..." />
                        
                        <div className="pt-2">
                           <button 
                            onClick={() => setShowPlayground(!showPlayground)}
                            className="w-full py-2 text-[9px] font-black uppercase text-slate-500 hover:text-slate-300 transition-colors tracking-[0.2em]"
                          >
                            {showPlayground ? "[-] Hide Advanced Tuning" : "[+] Show Advanced Tuning"}
                          </button>
                        </div>

                        {showPlayground && (
                          <div className="space-y-4 animate-fade-in border-t border-white/5 pt-4">
                            <TextArea label="Few-Shot Examples" name="few_shot_examples" value={form.few_shot_examples} onChange={handleInputChange} rows={3} />
                            <TextArea label="Static Resources (URLs/Docs)" name="static_resources" value={form.static_resources} onChange={handleInputChange} rows={2} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8">
                      <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all text-xs active:scale-[0.98]"
                      >
                        {loading ? "Forging..." : "Synthesize Master Prompt"}
                      </button>
                      {error && <p className="text-[10px] text-red-500 font-bold text-center mt-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
                    </div>
                  </section>
                </div>

                {/* OUTPUT PANEL */}
                <div className="lg:col-span-8 space-y-8">
                  {output ? (
                    <div className="space-y-8 animate-fade-in">
                      {/* PROMPT BOX */}
                      <section className="bg-[#0e1014] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-8 space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">FINAL_PROMPT</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Optimized for {form.target_AI}</p>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                onClick={() => copyToClipboard(output.FINAL_PROMPT)}
                                className="px-6 py-2 bg-white text-black text-[10px] font-black rounded-lg hover:bg-slate-200 transition-all uppercase tracking-widest shadow-xl"
                              >
                                {copied ? "Copied!" : "Copy String"}
                              </button>
                            </div>
                          </div>
                          <div className="bg-black/80 p-8 rounded-2xl border border-white/5 text-sm font-medium text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[600px] overflow-y-auto custom-scrollbar shadow-inner select-all">
                            {output.FINAL_PROMPT}
                          </div>
                        </div>

                        {/* ARCHITECT NOTES */}
                        <div className="bg-indigo-600/5 p-8 border-t border-white/5">
                           <div className="grid md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Design Decisions
                                </h4>
                                <ul className="space-y-3">
                                  {output.NOTES_FOR_HUMAN_PROMPT_ENGINEER?.map((note, i) => (
                                    <li key={i} className="text-[11px] text-slate-400 flex gap-3 leading-relaxed">
                                      <span className="text-indigo-500 font-black">•</span>
                                      <span>{note}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {generatedVisualUrl && (
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Visual Context
                                  </h4>
                                  <div className="relative group">
                                    <img src={generatedVisualUrl} alt="Visual inspiration" className="w-full rounded-xl border border-white/10 shadow-xl" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                                      <p className="text-[10px] font-black text-white uppercase tracking-widest">UI Inspiration Prompt Applied</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                           </div>
                        </div>
                      </section>

                      {/* SIMULATION (SANDBOX) */}
                      <section className="bg-[#0e1014] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                         <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                              <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Simulation Environment</h3>
                              <span className="text-[9px] font-mono text-emerald-500 uppercase font-bold tracking-tighter">Status: Active</span>
                            </div>
                            
                            <div className="h-[350px] overflow-y-auto space-y-4 pr-4 custom-scrollbar bg-black/30 p-6 rounded-2xl border border-white/5">
                              {testMessages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full opacity-20">
                                  <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ready for testing...</p>
                                </div>
                              )}
                              {testMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                                    <span className="text-[9px] font-black uppercase mb-1 block opacity-50">{msg.role}</span>
                                    {msg.content}
                                  </div>
                                </div>
                              ))}
                              {isTesting && (
                                <div className="flex gap-2 items-center text-[10px] font-black text-indigo-500 animate-pulse uppercase">
                                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                  Processing Input...
                                </div>
                              )}
                              <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleRunTest} className="flex gap-4">
                              <input 
                                type="text" 
                                placeholder="Enter test query..."
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 text-white text-xs rounded-xl px-5 py-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                              />
                              <button 
                                type="submit" 
                                disabled={isTesting || !testInput.trim()} 
                                className="bg-white text-black px-10 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all disabled:opacity-30"
                              >
                                Run
                              </button>
                            </form>
                         </div>
                      </section>

                      {/* GROWTH TOOLS */}
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                          onClick={handleGenerateKit}
                          disabled={isGeneratingKit}
                          className="group relative h-32 overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-left transition-all hover:scale-[1.02] shadow-2xl active:scale-[0.98]"
                        >
                           <div className="relative z-10 flex flex-col h-full justify-between">
                             <h4 className="text-[10px] font-black text-white uppercase tracking-widest opacity-80 italic">Commercial Layer</h4>
                             <p className="text-lg font-black text-white leading-none">Synthesize Growth Kit</p>
                           </div>
                           <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-125 transition-transform">
                             <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                           </div>
                        </button>

                        <div className="bg-[#0e1014] border border-white/5 rounded-3xl p-8 flex items-center justify-between">
                           <div>
                             <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic mb-2">Architectural Meta</h4>
                             <p className="text-xs text-slate-400 font-medium">Model: {form.target_AI} | Goal: {form.task_type}</p>
                           </div>
                           <div className="flex gap-2">
                             <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                             </div>
                           </div>
                        </div>
                      </section>

                      {marketingKit && (
                         <section className="bg-indigo-950/20 border border-indigo-500/10 p-10 rounded-[2.5rem] animate-fade-in">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-10 text-center">Market Distribution Kit</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                               <div className="space-y-3">
                                 <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                   <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                                   Ad Copy
                                 </h4>
                                 <div className="p-5 bg-black/40 rounded-2xl text-[11px] text-slate-300 border border-white/5 min-h-[150px] leading-relaxed">{marketingKit.social_ads}</div>
                               </div>
                               <div className="space-y-3">
                                 <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                   <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                                   Landing Architecture
                                 </h4>
                                 <div className="p-5 bg-black/40 rounded-2xl text-[11px] text-slate-300 border border-white/5 min-h-[150px] leading-relaxed">{marketingKit.landing_page}</div>
                               </div>
                               <div className="space-y-3">
                                 <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                   <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                                   Activation Sequence
                                 </h4>
                                 <div className="p-5 bg-black/40 rounded-2xl text-[11px] text-slate-300 border border-white/5 min-h-[150px] leading-relaxed">{marketingKit.email_sequence}</div>
                               </div>
                            </div>
                         </section>
                      )}
                    </div>
                  ) : (
                    <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-[#0e1014] border border-white/5 rounded-[3rem] animate-fade-in group">
                      <div className="relative mb-10">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-tr from-indigo-600 to-cyan-400 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a2 2 0 002 2h3a2 2 0 012 2v1a2 2 0 002 2 2 2 0 110 4 2 2 0 00-2 2v3a2 2 0 01-2 2h-3a2 2 0 00-2 2v1a2 2 0 11-4 0v-1a2 2 0 00-2-2H7a2 2 0 01-2-2v-3a2 2 0 00-2-2 2 2 0 110-4 2 2 0 002-2V7a2 2 0 012-2h3a2 2 0 002-2V4z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="font-black text-3xl text-white tracking-tighter uppercase italic leading-none mb-4">Laboratory Idle</h3>
                      <p className="text-slate-500 max-w-[320px] text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed opacity-60">Engine standby. Configure architectural seed to initiate the synthesis of high-performance prompt strings.</p>
                      
                      <div className="mt-12 flex gap-4">
                         <div className="px-6 py-2 border border-white/5 rounded-full text-[9px] font-black uppercase text-slate-700 tracking-widest">v2.5_CORE</div>
                         <div className="px-6 py-2 border border-white/5 rounded-full text-[9px] font-black uppercase text-slate-700 tracking-widest">MULTI_MODAL_ENABLE</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-12 animate-fade-in">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">The Vault.</h2>
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.4em] mt-3">Persistence Synchronization Shard</p>
                  </div>
                  <div className="relative w-full sm:w-96">
                    <input 
                      type="text" 
                      placeholder="Filter records..." 
                      className="w-full px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-indigo-500 transition-all pl-14"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </header>

                {filteredHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-[#0e1014] p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-xl" 
                        onClick={() => {
                          setForm(item.input);
                          setOutput(item.output);
                          setActiveTab('build');
                        }}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <span className="px-4 py-1.5 bg-indigo-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest">{item.input.target_AI}</span>
                          <span className="text-[10px] text-slate-600 font-mono font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-black text-white text-lg line-clamp-2 mb-4 uppercase italic tracking-tighter leading-tight group-hover:text-indigo-400 transition-colors">{item.input.high_level_goal}</h3>
                        <p className="text-[11px] text-slate-500 line-clamp-4 leading-relaxed font-mono bg-black/30 p-4 rounded-xl border border-white/5">{item.output.FINAL_PROMPT}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-40 text-center opacity-20">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">No records found in synchronization cache.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dev' && (
              <div className="space-y-12 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-end justify-between gap-6">
                  <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Console.</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">Live Production Webhook Pipeline</p>
                  </div>
                  <div className="flex gap-4">
                    {apiKeys.length > 0 ? apiKeys.map(key => (
                      <div key={key.id} className="px-6 py-3 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-4">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Live Endpoint ID</p>
                          <p className="text-[10px] font-mono font-bold text-indigo-400">{key.key.substring(0, 16)}...</p>
                        </div>
                      </div>
                    )) : (
                      <div className="px-6 py-3 bg-red-500/5 border border-red-500/20 rounded-2xl">
                         <p className="text-[10px] font-black text-red-500 uppercase">Offline Node</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#0e1014] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="p-10 font-mono text-[11px] space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar">
                    {logs.length > 0 ? logs.map((log) => (
                      <div key={log.id} className="flex gap-8 border-b border-white/5 pb-4 last:border-0 hover:bg-white/5 transition-all p-4 rounded-xl">
                        <span className="text-slate-700 shrink-0 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <div className="shrink-0">
                           <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{log.status}</span>
                        </div>
                        <span className="text-indigo-500 font-bold shrink-0 min-w-[150px]">{log.type}</span>
                        <span className="text-slate-400 truncate font-mono text-[10px] leading-none mt-1 opacity-60">DATA_PACKET: {JSON.stringify(log.payload)}</span>
                      </div>
                    )) : (
                      <div className="py-40 text-center space-y-8">
                        <div className="relative inline-block">
                          <div className="w-4 h-4 bg-indigo-500/20 rounded-full animate-ping absolute inset-0"></div>
                          <div className="w-4 h-4 bg-indigo-500 rounded-full relative"></div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-white italic uppercase font-black tracking-[0.4em] text-xs">Listening for Production Signal...</p>
                           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest max-w-[400px] mx-auto leading-relaxed">Ensure your Render backend is deployed with valid Stripe signing secrets for live telemetry.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="p-8 bg-[#0e1014] border border-white/5 rounded-3xl">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pipeline Latency</h4>
                      <p className="text-2xl font-mono font-black text-white">42ms</p>
                   </div>
                   <div className="p-8 bg-[#0e1014] border border-white/5 rounded-3xl">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Ingress Total</h4>
                      <p className="text-2xl font-mono font-black text-white">{logs.length}</p>
                   </div>
                   <div className="p-8 bg-[#0e1014] border border-white/5 rounded-3xl">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">System Uptime</h4>
                      <p className="text-2xl font-mono font-black text-white">99.98%</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
