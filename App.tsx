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

/**
 * Architect.io: Master Prompt Engineering Suite
 * Pure Standalone Mode (Vercel/Netlify Ready)
 */
const App: React.FC = () => {
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'build' | 'history' | 'dev'>('build');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- LOCAL DATA VAULT ---
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    plan: 'Architect',
    creditsRemaining: 1000,
    totalCredits: 1000
  });
  const [logs, setLogs] = useState<WebhookEvent[]>([]);

  // --- FORM STATE ---
  const [simpleDesc, setSimpleDesc] = useState('');
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [generatedVisualUrl, setGeneratedVisualUrl] = useState<string | null>(null);
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [marketingKit, setMarketingKit] = useState<MarketingKit | null>(null);
  const [showGrowthHub, setShowGrowthHub] = useState(false);

  // --- PLAYGROUND STATE ---
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<{role:'user'|'assistant', content:string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 2.0",
    high_level_goal: "",
    task_type: "Strategy",
    domain_context: "",
    user_persona: "",
    audience_persona: "",
    tone_style: "Professional",
    output_format: "Plain Text",
    length_and_depth: "Balanced",
    reasoning_visibility: "hidden",
    language: "English",
    visual_inspiration_mode: true,
    few_shot_examples: "",
    constraints_and_pitfalls: "",
    static_resources: ""
  });

  // --- PERSISTENCE ENGINE ---
  useEffect(() => {
    const savedVault = localStorage.getItem('architect_vault_v2');
    const savedCredits = localStorage.getItem('architect_credits');
    const savedLogs = localStorage.getItem('architect_logs');

    if (savedVault) setHistory(JSON.parse(savedVault));
    if (savedCredits) setUserStatus(prev => ({ ...prev, creditsRemaining: parseInt(savedCredits) }));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  const saveToVault = (newItem: HistoryItem) => {
    const updated = [newItem, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('architect_vault_v2', JSON.stringify(updated));
  };

  const addLog = (type: string, status: 'success' | 'failed', payload: any) => {
    const newLog: WebhookEvent = {
      id: Math.random().toString(36).substring(7),
      type,
      timestamp: Date.now(),
      status,
      payload
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    setLogs(updatedLogs);
    localStorage.setItem('architect_logs', JSON.stringify(updatedLogs));
  };

  // --- ACTIONS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMagicFill = async () => {
    if (!simpleDesc.trim()) return;
    setIsMagicFilling(true);
    addLog('magic.fill', 'success', { description: simpleDesc });
    try {
      const suggested = await magicFillMetaInputs(simpleDesc, form.language);
      setForm(prev => ({ ...prev, high_level_goal: simpleDesc, ...suggested }));
    } finally {
      setIsMagicFilling(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.high_level_goal.trim()) {
      setError("High Level Goal is required to proceed.");
      return;
    }
    if (userStatus.creditsRemaining < 25) {
      setError("Insufficient local credits. Reset your browser storage to refill.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedVisualUrl(null);
    setMarketingKit(null);
    setShowGrowthHub(false);
    setTestMessages([]);

    try {
      const result = await generateArchitectPrompt(form);
      setOutput(result);

      // Persistence
      const newItem: HistoryItem = {
        id: `arch_${Date.now()}`,
        timestamp: Date.now(),
        input: { ...form },
        output: { ...result }
      };
      saveToVault(newItem);

      // Deduct credits locally
      const newCredits = Math.max(0, userStatus.creditsRemaining - 25);
      setUserStatus(prev => ({ ...prev, creditsRemaining: newCredits }));
      localStorage.setItem('architect_credits', newCredits.toString());

      addLog('prompt.generate', 'success', { target: form.target_AI });

      if (form.visual_inspiration_mode && result.VISUAL_INSPIRATION_PROMPT) {
        generateVisualImage(result.VISUAL_INSPIRATION_PROMPT).then(setGeneratedVisualUrl).catch(e => {
            console.error(e);
            addLog('visual.generate', 'failed', { error: e.message });
        });
      }
    } catch (err: any) {
      setError(err.message || "Optimization failure.");
      addLog('prompt.generate', 'failed', { error: err.message });
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
      setShowGrowthHub(true);
      addLog('marketing.kit', 'success', { goal: form.high_level_goal });
    } catch (e) {
      setError("Growth Kit generation failed.");
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
    <div className="flex flex-col h-screen bg-[#0a0c10] font-sans selection:bg-indigo-500/30">
      {/* GLOBAL NAVIGATION */}
      <header className="flex-none h-16 border-b border-white/5 bg-[#0a0c10]/80 backdrop-blur-xl flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20">A</div>
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">Architect.io</h1>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <nav className="flex items-center gap-1">
            {(['build', 'history', 'dev'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Local Balance</span>
            <span className="text-xs font-mono font-bold text-indigo-400">{userStatus.creditsRemaining} CR</span>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Standalone Node</span>
          </div>
        </div>
      </header>

      {/* VIEWPORT CANVAS */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 lg:p-10">
            {activeTab === 'build' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* CONFIGURATION PANEL */}
                <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                  <section className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-6 shadow-2xl">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Seed Strategy</h2>
                         <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black rounded border border-indigo-500/20 uppercase">Neural Fill</span>
                      </div>
                      <TextArea 
                        label="" 
                        placeholder="Describe the objective in natural language..."
                        value={simpleDesc}
                        onChange={(e) => setSimpleDesc(e.target.value)}
                        className="bg-transparent border-none text-white placeholder:text-slate-600 focus:ring-0 text-sm font-medium leading-relaxed p-0 min-h-[80px]"
                      />
                      <button 
                        onClick={handleMagicFill}
                        disabled={isMagicFilling || !simpleDesc}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                      >
                        {isMagicFilling ? "Scanning Matrices..." : "✨ Infer Logic Gate"}
                      </button>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Platform" name="target_AI" value={form.target_AI} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-xl text-xs font-bold h-12">
                        <option value="Gemini 2.0">Gemini 2.0</option>
                        <option value="ChatGPT o3">ChatGPT o3</option>
                        <option value="Claude 3.5">Claude 3.5</option>
                        <option value="Llama 3.1">Llama 3.1</option>
                      </Select>
                      <Select label="Task Domain" name="task_type" value={form.task_type} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-xl text-xs font-bold h-12">
                        <option value="Strategy">Strategic</option>
                        <option value="Technical">Technical</option>
                        <option value="Creative">Creative</option>
                        <option value="Academic">Academic</option>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <TextInput label="Persona" name="user_persona" value={form.user_persona} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-xl text-xs font-bold h-12" />
                        <TextInput label="Audience" name="audience_persona" value={form.audience_persona} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-xl text-xs font-bold h-12" />
                      </div>
                      <TextArea label="Constraints" name="constraints_and_pitfalls" value={form.constraints_and_pitfalls} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-2xl text-xs font-bold h-24" />
                    </div>

                    <button 
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all text-xs active:scale-[0.98]"
                    >
                      {loading ? "Forging..." : "Synthesize Prompt"}
                    </button>
                    {error && <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-widest">{error}</p>}
                  </section>
                </div>

                {/* OUTPUT DISPLAY */}
                <div className="lg:col-span-8 space-y-10">
                  {output ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                      {/* Master Prompt Output */}
                      <section className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-8 lg:p-12 space-y-8">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Blueprint Ready.</h3>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Optimized for {form.target_AI} Ecosystem</p>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(output.FINAL_PROMPT)}
                              className="px-8 py-3 bg-white text-black text-[10px] font-black rounded-full hover:bg-slate-200 transition-all uppercase tracking-widest shadow-xl"
                            >
                              {copied ? "Copied" : "Copy String"}
                            </button>
                          </div>
                          <div className="bg-black/40 p-10 rounded-[2rem] border border-white/5 text-lg font-medium text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[600px] overflow-y-auto custom-scrollbar shadow-inner">
                            {output.FINAL_PROMPT}
                          </div>
                        </div>
                        
                        {/* Notes Section */}
                        <div className="bg-indigo-500/5 p-8 border-t border-white/5 grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Architectural Records</h4>
                             <ul className="space-y-3">
                               {output.NOTES_FOR_HUMAN_PROMPT_ENGINEER?.map((note, i) => (
                                 <li key={i} className="text-xs text-slate-400 flex gap-3">
                                   <span className="text-indigo-500 font-black">0{i+1}</span>
                                   <span className="leading-normal">{note}</span>
                                 </li>
                               ))}
                             </ul>
                           </div>
                           {generatedVisualUrl && (
                             <div className="space-y-4">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Reference Visual</h4>
                               <img src={generatedVisualUrl} alt="Concept UI" className="w-full rounded-2xl border border-white/10 shadow-2xl hover:scale-105 transition-transform duration-500" />
                             </div>
                           )}
                        </div>
                      </section>

                      {/* Simulation & Growth */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                          onClick={handleGenerateKit}
                          disabled={isGeneratingKit}
                          className="group relative overflow-hidden py-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative text-[10px] font-black uppercase tracking-[0.3em]">
                            {isGeneratingKit ? "Analyzing Markets..." : "Build Growth Kit"}
                          </span>
                        </button>
                        <button 
                          onClick={() => setShowGrowthHub(!showGrowthHub)}
                          className="py-8 bg-white/5 border border-white/5 rounded-[2rem] text-slate-300 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                            {showGrowthHub ? "Close Lab" : "Open Simulator"}
                          </span>
                        </button>
                      </div>

                      {showGrowthHub && marketingKit && (
                        <section className="bg-indigo-950/40 border border-indigo-500/20 p-10 rounded-[3rem] animate-in zoom-in-95 duration-500">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <div className="p-6 bg-indigo-500/10 rounded-2xl space-y-4 border border-indigo-500/10">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ad Ecosystem</h4>
                               <p className="text-xs text-indigo-100/70 leading-relaxed whitespace-pre-wrap">{marketingKit.social_ads}</p>
                             </div>
                             <div className="p-6 bg-indigo-500/10 rounded-2xl space-y-4 border border-indigo-500/10">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Landing Blueprint</h4>
                               <p className="text-xs text-indigo-100/70 leading-relaxed whitespace-pre-wrap">{marketingKit.landing_page}</p>
                             </div>
                             <div className="p-6 bg-indigo-500/10 rounded-2xl space-y-4 border border-indigo-500/10">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Growth Loop</h4>
                               <p className="text-xs text-indigo-100/70 leading-relaxed whitespace-pre-wrap">{marketingKit.email_sequence}</p>
                             </div>
                          </div>
                        </section>
                      )}

                      {/* Playground Interface */}
                      <section className="bg-slate-900 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-10 space-y-8">
                          <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Simulation Environment</h3>
                            <div className="flex gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20"></div>
                            </div>
                          </div>
                          
                          <div className="h-[400px] overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                            {testMessages.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20 italic">
                                <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                <p className="text-xs uppercase tracking-[0.3em] font-black">Awaiting Initialization</p>
                              </div>
                            )}
                            {testMessages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                            {isTesting && <div className="text-[10px] font-black text-indigo-500 animate-pulse uppercase tracking-widest ml-2">Engine Synthesizing Response...</div>}
                            <div ref={chatEndRef} />
                          </div>

                          <form onSubmit={handleRunTest} className="flex gap-4">
                            <input 
                              type="text" 
                              placeholder="Simulate user input to verify your prompt..."
                              value={testInput}
                              onChange={(e) => setTestInput(e.target.value)}
                              className="flex-1 bg-black/40 border border-white/5 text-white text-sm rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                            />
                            <button 
                              type="submit"
                              disabled={isTesting || !testInput.trim()}
                              className="bg-white text-black px-8 rounded-2xl hover:bg-slate-200 disabled:opacity-30 font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                              Run
                            </button>
                          </form>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/5 rounded-[4rem] animate-in fade-in duration-1000">
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/20">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                      </div>
                      <h3 className="font-black text-3xl text-white tracking-tighter uppercase italic leading-none">Architect Prime</h3>
                      <p className="text-slate-500 max-w-[320px] mt-4 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed">Synthesize production-grade prompts by configuring your parameters on the left.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">The Vault.</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Immutable Persistence Shard</p>
                  </div>
                  <div className="relative w-full sm:w-96">
                    <input 
                      type="text" 
                      placeholder="Query local vault..." 
                      className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-full text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </header>

                {filteredHistory.length === 0 ? (
                  <div className="p-32 rounded-[4rem] bg-white/5 border-2 border-dashed border-white/5 text-center space-y-4">
                    <p className="font-black text-slate-600 uppercase text-xs tracking-widest leading-none">Zero entries detected</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white/5 p-8 rounded-[3rem] border border-white/5 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col h-full" 
                        onClick={() => {
                          setForm(item.input);
                          setOutput(item.output);
                          setActiveTab('build');
                        }}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <span className="px-3 py-1 bg-white text-black text-[9px] font-black rounded-full uppercase">{item.input.target_AI}</span>
                          <span className="text-[10px] text-slate-600 font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-black text-white text-lg line-clamp-2 mb-4 tracking-tight leading-tight group-hover:text-indigo-400 transition-colors uppercase italic">{item.input.high_level_goal}</h3>
                        <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed mb-8 flex-grow font-mono">{item.output.FINAL_PROMPT}</p>
                        <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                           <span>{item.input.task_type}</span>
                           <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Deploy Node &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dev' && (
              <div className="space-y-12 animate-in fade-in duration-500 h-full flex flex-col">
                <div>
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">Console.</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Real-time Local Execution Trace</p>
                </div>
                
                <div className="flex-1 bg-black border border-white/5 rounded-[2rem] overflow-hidden flex flex-col min-h-[500px]">
                  <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">arch_kernel_0.1.0-st</span>
                  </div>
                  <div className="p-10 font-mono text-[11px] space-y-4 overflow-y-auto custom-scrollbar">
                    {logs.length === 0 && <div className="text-slate-800 italic">No cycles executed yet...</div>}
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-6 border-b border-white/5 pb-4 last:border-0 hover:bg-white/5 px-4 -mx-4 transition-colors">
                        <span className="text-slate-700 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-indigo-500 font-bold shrink-0">{log.type}</span>
                        <span className={`font-black shrink-0 ${log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{log.status.toUpperCase()}</span>
                        <span className="text-slate-500 truncate italic">shard_payload: {JSON.stringify(log.payload)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
      `}</style>
    </div>
  );
};

export default App;