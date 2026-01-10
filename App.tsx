
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
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const App: React.FC = () => {
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'build' | 'history' | 'dev' | 'voice'>('build');
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [sysError, setSysError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [backendHealth, setBackendHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
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

    const checkHealth = async () => {
      try {
        const health = await backendService.checkHealth();
        if (health === 'OK') {
          setBackendHealth('online');
          const [backendLogs, keys] = await Promise.all([
            backendService.getWebhookLogs(),
            backendService.getApiKeys()
          ]);
          setLogs(backendLogs);
          setApiKeys(keys);
        } else {
          setBackendHealth('offline');
        }
      } catch (e) {
        setBackendHealth('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 20000); 
    return () => clearInterval(interval);
  }, []);

  const saveToVault = (newItem: HistoryItem) => {
    const updated = [newItem, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('architect_vault_v3', JSON.stringify(updated));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setSysError(null);
    try {
      const result = await backendService.createCheckoutSession('Architect', 49);
      if (result.url && result.url !== '#error') {
        window.location.href = result.url;
      } else {
        throw new Error("Stripe keys missing or invalid on Render backend.");
      }
    } catch (err: any) {
      setSysError(err.message || "Failed to initiate payment. Check server logs.");
      setLoading(false);
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
      setGenError("Define your goal to start synthesis.");
      return;
    }
    setLoading(true);
    setGenError(null);
    setGeneratedVisualUrl(null);
    setMarketingKit(null);
    try {
      const result = await generateArchitectPrompt(form);
      setOutput(result);
      saveToVault({ id: `arch_${Date.now()}`, timestamp: Date.now(), input: { ...form }, output: { ...result } });
      setUserStatus(prev => ({ ...prev, creditsRemaining: Math.max(0, prev.creditsRemaining - 1) }));
      if (form.visual_inspiration_mode && result.VISUAL_INSPIRATION_PROMPT) {
        generateVisualImage(result.VISUAL_INSPIRATION_PROMPT).then(setGeneratedVisualUrl).catch(console.error);
      }
    } catch (err: any) {
      setGenError(err.message || "Synthesis failed.");
    } finally {
      setLoading(false);
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
          <div className="hidden sm:block">
            <h1 className="text-base font-black tracking-widest text-white uppercase">Architect.io</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">V4.0 Master Suite</p>
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
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <div className={`w-2 h-2 rounded-full animate-pulse ${backendHealth === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{backendHealth}</span>
          </div>
          <button onClick={() => setShowUpgradeModal(true)} className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all shadow-xl shadow-white/10">
            Upgrade
          </button>
        </div>
      </header>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#0e1014] border border-white/5 max-w-lg w-full rounded-[3rem] p-12 shadow-2xl relative">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center space-y-8">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Enterprise Access</h2>
              <p className="text-slate-500 text-xs uppercase tracking-[0.2em] leading-relaxed">Unlock persistence, multi-user vault sync, and high-performance growth tools.</p>
              
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-4">
                 <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-indigo-400">
                    <span>Architect Tier</span>
                    <span>$49 / Month</span>
                 </div>
                 <ul className="text-left text-[10px] text-slate-600 space-y-3 uppercase font-bold tracking-widest">
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> 10,000 Synthesis Credits</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Full Marketing Kit Engine</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> API Shard Rotation</li>
                 </ul>
              </div>

              {sysError && (
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] text-rose-500 font-black uppercase leading-relaxed tracking-widest text-center">
                  Error: {sysError}
                </div>
              )}

              <button 
                onClick={handleUpgrade} 
                disabled={loading}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-indigo-600/30"
              >
                {loading ? "Establishing Link..." : "Initialize Upgrade"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 lg:p-10">
            {activeTab === 'build' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* BUILD CONFIG */}
                <div className="lg:col-span-4 space-y-6">
                  <section className="bg-[#0e1014]/90 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in backdrop-blur-xl">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                        <h2 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest italic">Core Blueprint</h2>
                        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">V4_SYNC</span>
                      </div>
                      
                      <TextArea 
                        label="Describe the Task" 
                        placeholder="e.g. Design a robust 7-email onboarding sequence for technical SaaS founders..."
                        value={simpleDesc}
                        onChange={(e) => setSimpleDesc(e.target.value)}
                        className="bg-black/50 border-white/10 text-white text-xs min-h-[140px]"
                      />
                      
                      <button 
                        onClick={handleMagicFill}
                        disabled={isMagicFilling || !simpleDesc}
                        className="w-full py-4 bg-indigo-600/5 hover:bg-indigo-600/15 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition-all"
                      >
                        {isMagicFilling ? "Inferring Matrix..." : "✨ Auto-Fill Shard"}
                      </button>
                    </div>

                    <div className="mt-10 space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <Select label="Target Model" name="target_AI" value={form.target_AI} onChange={handleInputChange}>
                          <option value="Gemini 2.0">Gemini 2.0</option>
                          <option value="ChatGPT o3">ChatGPT o3</option>
                          <option value="Claude 3.5">Claude 3.5</option>
                          <option value="Llama 3.1">Llama 3.1</option>
                        </Select>
                        <Select label="CoT Path" name="reasoning_visibility" value={form.reasoning_visibility} onChange={handleInputChange}>
                          <option value="hidden">Direct</option>
                          <option value="brief">Brief CoT</option>
                          <option value="detailed">Full CoT</option>
                        </Select>
                      </div>

                      <div className="space-y-5">
                        <TextInput label="Goal Summary" name="high_level_goal" value={form.high_level_goal} onChange={handleInputChange} />
                        <div className="grid grid-cols-2 gap-4">
                          <TextInput label="Persona" name="user_persona" value={form.user_persona} onChange={handleInputChange} />
                          <TextInput label="Tone" name="tone_style" value={form.tone_style} onChange={handleInputChange} />
                        </div>
                        <TextArea label="Constraints" name="constraints_and_pitfalls" value={form.constraints_and_pitfalls} onChange={handleInputChange} rows={2} />
                      </div>
                    </div>

                    <div className="mt-12">
                      <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 transition-all text-xs"
                      >
                        {loading ? "Forging..." : "Synthesize Architecture"}
                      </button>
                      {genError && <p className="mt-4 text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center">{genError}</p>}
                    </div>
                  </section>
                </div>

                {/* OUTPUT DISPLAY */}
                <div className="lg:col-span-8 space-y-10">
                  {output ? (
                    <div className="space-y-10 animate-fade-in">
                      <section className="bg-[#0e1014] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-12 space-y-8">
                          <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">FINAL_PROMPT</h3>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Matrix Optimized: {form.target_AI}</p>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(output.FINAL_PROMPT)}
                              className="px-10 py-4 bg-white text-black text-[11px] font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest shadow-2xl"
                            >
                              {copied ? "Copied" : "Copy Prompt"}
                            </button>
                          </div>
                          <div className="bg-black/80 p-12 rounded-[2.5rem] border border-white/5 text-sm font-medium text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[700px] overflow-y-auto custom-scrollbar select-all shadow-inner">
                            {output.FINAL_PROMPT}
                          </div>
                        </div>

                        <div className="bg-indigo-600/5 p-12 border-t border-white/5">
                           <div className="grid md:grid-cols-2 gap-12">
                              <div className="space-y-8">
                                <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-4 italic">Architectural Logic</h4>
                                <ul className="space-y-4">
                                  {output.NOTES_FOR_HUMAN_PROMPT_ENGINEER?.map((note, i) => (
                                    <li key={i} className="text-[12px] text-slate-400 flex gap-5 leading-relaxed bg-white/5 p-5 rounded-3xl border border-white/5">
                                      <span className="text-indigo-500 font-black">L_{i+1}</span>
                                      <span>{note}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {generatedVisualUrl && (
                                <div className="space-y-8">
                                  <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-4 italic">Neural Preview</h4>
                                  <div className="relative group overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl">
                                    <img src={generatedVisualUrl} alt="Vibe" className="w-full grayscale group-hover:grayscale-0 transition-all duration-1000" />
                                  </div>
                                </div>
                              )}
                           </div>
                        </div>
                      </section>

                      {/* SANDBOX TERMINAL */}
                      <section className="bg-[#0e1014] border border-white/5 rounded-[3rem] p-12 shadow-2xl">
                        <div className="space-y-8">
                          <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Sandbox Terminal</h3>
                            <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold tracking-[0.3em]">Operational</span>
                          </div>
                          
                          <div className="h-[400px] overflow-y-auto space-y-6 pr-6 custom-scrollbar bg-black/40 p-10 rounded-[2.5rem] border border-white/5">
                            {testMessages.length === 0 && (
                              <div className="flex flex-col items-center justify-center h-full opacity-10">
                                <p className="text-[12px] font-black uppercase tracking-[0.5em]">Terminal Ready</p>
                              </div>
                            )}
                            {testMessages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[13px] font-medium ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                            {isTesting && <div className="text-[10px] font-black text-indigo-500 animate-pulse uppercase">Synthesizing...</div>}
                            <div ref={chatEndRef} />
                          </div>

                          <form onSubmit={handleRunTest} className="flex gap-6">
                            <input 
                              type="text" 
                              placeholder="Test architectural integrity..."
                              value={testInput}
                              onChange={(e) => setTestInput(e.target.value)}
                              className="flex-1 bg-black/50 border border-white/10 text-white text-sm rounded-2xl px-8 py-5 outline-none focus:border-indigo-500 transition-all"
                            />
                            <button type="submit" className="bg-white text-black px-12 rounded-2xl font-black text-[11px] uppercase hover:bg-slate-200 transition-all">Execute</button>
                          </form>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-16 bg-[#0e1014]/60 border border-white/5 rounded-[5rem] animate-fade-in group backdrop-blur-xl">
                      <div className="relative mb-14">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full group-hover:scale-150 transition-all duration-1000"></div>
                        <div className="relative w-32 h-32 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-[3.5rem] flex items-center justify-center shadow-2xl border-4 border-white/5">
                          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="font-black text-5xl text-white tracking-tighter uppercase italic leading-none mb-8">Architect Standby.</h3>
                      <p className="text-slate-500 max-w-[420px] text-[12px] font-bold uppercase tracking-[0.4em] leading-relaxed opacity-60">Input an architectural seed to initiate high-performance prompt synthesis.</p>
                      
                      <div className="mt-20 flex gap-8">
                         <div className="px-10 py-3 border border-white/5 rounded-full text-[10px] font-black uppercase text-slate-700 tracking-[0.5em] shadow-inner">QUANTUM_V4_0</div>
                         <div className="px-10 py-3 border border-white/5 rounded-full text-[10px] font-black uppercase text-slate-700 tracking-[0.5em] shadow-inner">MULTI_AI_SYNC</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dev' && (
              <div className="space-y-16 animate-fade-in">
                 <header className="flex flex-col sm:flex-row items-end justify-between gap-10">
                   <div>
                    <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">Console.</h2>
                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.6em] mt-6">Backend Diagnostic & Webhook Matrix</p>
                  </div>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="bg-[#0e1014] border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl">
                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">Connection Health</h4>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Backend URL</span>
                           <span className="text-[10px] font-mono text-indigo-400">architect-io.onrender.com</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Code</span>
                           <span className={`text-[10px] font-mono ${backendHealth === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>{backendHealth === 'online' ? '200 OK' : 'ECONNREFUSED'}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment</span>
                           <span className="text-[10px] font-mono text-slate-500 uppercase">Production-Ready</span>
                        </div>
                      </div>
                      <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                         <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3">Mismatch Diagnostic</h5>
                         <p className="text-[10px] text-slate-500 leading-relaxed font-medium">If 'Status' is offline: Ensure your Render service is deployed. If 'License' fails: Verify STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are matching your netlify-production profile.</p>
                      </div>
                   </div>

                   <div className="bg-[#0e1014] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
                      <div className="p-10 font-mono text-[11px] space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic mb-6">Live Packet Stream</h4>
                        {logs.length > 0 ? logs.map(log => (
                          <div key={log.id} className="py-4 border-b border-white/5 flex gap-8 opacity-50 hover:opacity-100 transition-all">
                            <span className="text-indigo-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className="text-white uppercase font-black italic">{log.type}</span>
                          </div>
                        )) : <p className="text-slate-800 uppercase font-black tracking-widest text-center py-20">Awaiting Ingress Signals...</p>}
                      </div>
                   </div>
                </div>
              </div>
            )}
            
            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-16 animate-fade-in">
                <header className="flex flex-col sm:flex-row items-end justify-between gap-10">
                  <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">Vault.</h2>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {history.map(item => (
                    <div key={item.id} className="bg-[#0e1014] p-10 rounded-[3.5rem] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-2xl group" onClick={() => { setForm(item.input); setOutput(item.output); setActiveTab('build'); }}>
                      <span className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest mb-6 inline-block">{item.input.target_AI}</span>
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter line-clamp-2 leading-tight">{item.input.high_level_goal}</h4>
                    </div>
                  ))}
                  {history.length === 0 && <div className="col-span-full py-40 text-center opacity-20"><p className="text-[12px] font-black uppercase tracking-[0.5em]">No synchronization fragments found.</p></div>}
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
