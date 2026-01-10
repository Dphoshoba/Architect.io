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
 * Architect.io: The Prompt Engineering Workbench
 * Pure Standalone Mode (Optimized for Vercel/Netlify)
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

  // --- PERSISTENCE ENGINE (Standalone) ---
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
    } catch (err: any) {
      addLog('magic.fill', 'failed', { error: err.message });
    } finally {
      setIsMagicFilling(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.high_level_goal.trim()) {
      setError("Specify your Strategic Goal to initiate forging.");
      return;
    }
    if (userStatus.creditsRemaining < 25) {
      setError("Vault credits exhausted. Refresh local storage to replenish.");
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

      const newItem: HistoryItem = {
        id: `arch_${Date.now()}`,
        timestamp: Date.now(),
        input: { ...form },
        output: { ...result }
      };
      saveToVault(newItem);

      const newCredits = Math.max(0, userStatus.creditsRemaining - 25);
      setUserStatus(prev => ({ ...prev, creditsRemaining: newCredits }));
      localStorage.setItem('architect_credits', newCredits.toString());

      addLog('prompt.forge', 'success', { target: form.target_AI });

      if (form.visual_inspiration_mode && result.VISUAL_INSPIRATION_PROMPT) {
        generateVisualImage(result.VISUAL_INSPIRATION_PROMPT).then(setGeneratedVisualUrl).catch(e => {
            console.error(e);
            addLog('visual.render', 'failed', { error: e.message });
        });
      }
    } catch (err: any) {
      setError(err.message || "The synthesis engine encountered a logic error.");
      addLog('prompt.forge', 'failed', { error: err.message });
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
      addLog('growth.kit', 'success', { goal: form.high_level_goal });
    } catch (e) {
      setError("Market Growth synthesis failed.");
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
      {/* NAVIGATION BAR */}
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
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Vault Reserve</span>
            <span className="text-xs font-mono font-bold text-indigo-400">{userStatus.creditsRemaining} CR</span>
          </div>
          <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Standalone Ready</span>
          </div>
        </div>
      </header>

      {/* WORKBENCH */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 lg:p-10">
            {activeTab === 'build' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* SETTINGS PANEL */}
                <div className="lg:col-span-4 space-y-8">
                  <section className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-6 shadow-2xl animate-fade-in">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Seed Description</h2>
                      </div>
                      <TextArea 
                        label="" 
                        placeholder="Explain the task in plain English..."
                        value={simpleDesc}
                        onChange={(e) => setSimpleDesc(e.target.value)}
                        className="bg-transparent border-none text-white placeholder:text-slate-700 focus:ring-0 text-sm font-medium leading-relaxed p-0 min-h-[60px]"
                      />
                      <button 
                        onClick={handleMagicFill}
                        disabled={isMagicFilling || !simpleDesc}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                      >
                        {isMagicFilling ? "Scanning Neural Networks..." : "✨ Infer Context"}
                      </button>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Model" name="target_AI" value={form.target_AI} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-xl text-xs font-bold h-12">
                        <option value="Gemini 2.0">Gemini 2.0</option>
                        <option value="ChatGPT o3">ChatGPT o3</option>
                        <option value="Claude 3.5">Claude 3.5</option>
                        <option value="Llama 3.1">Llama 3.1</option>
                      </Select>
                      <Select label="Type" name="task_type" value={form.task_type} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-xl text-xs font-bold h-12">
                        <option value="Strategy">Strategy</option>
                        <option value="Technical">Technical</option>
                        <option value="Creative">Creative</option>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <TextInput label="Persona" name="user_persona" value={form.user_persona} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-xl text-xs font-bold h-12" />
                      <TextArea label="Hard Constraints" name="constraints_and_pitfalls" value={form.constraints_and_pitfalls} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white rounded-2xl text-xs font-bold h-20" />
                    </div>

                    <button 
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all text-xs active:scale-[0.98]"
                    >
                      {loading ? "Synthesizing..." : "Forge Master Prompt"}
                    </button>
                    {error && <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-widest">{error}</p>}
                  </section>
                </div>

                {/* RESULTS PANEL */}
                <div className="lg:col-span-8 space-y-10">
                  {output ? (
                    <div className="space-y-10 animate-fade-in">
                      <section className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-8 lg:p-12 space-y-8">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Synthesized Blueprint.</h3>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Master String for {form.target_AI}</p>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(output.FINAL_PROMPT)}
                              className="px-8 py-3 bg-white text-black text-[10px] font-black rounded-full hover:bg-slate-200 transition-all uppercase tracking-widest shadow-xl"
                            >
                              {copied ? "Success" : "Copy Prompt"}
                            </button>
                          </div>
                          <div className="bg-black/40 p-10 rounded-[2rem] border border-white/5 text-base font-medium text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner">
                            {output.FINAL_PROMPT}
                          </div>
                        </div>
                        
                        <div className="bg-indigo-500/5 p-8 border-t border-white/5 grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Architectural Insights</h4>
                             <ul className="space-y-2">
                               {output.NOTES_FOR_HUMAN_PROMPT_ENGINEER?.map((note, i) => (
                                 <li key={i} className="text-[11px] text-slate-400 flex gap-2">
                                   <span className="text-indigo-500 font-black">#</span>
                                   <span>{note}</span>
                                 </li>
                               ))}
                             </ul>
                           </div>
                           {generatedVisualUrl && (
                             <div className="space-y-4">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">UI/UX Concept</h4>
                               <img src={generatedVisualUrl} alt="Concept UI" className="w-full rounded-2xl border border-white/10 shadow-2xl" />
                             </div>
                           )}
                        </div>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                          onClick={handleGenerateKit}
                          disabled={isGeneratingKit}
                          className="py-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] text-white transition-all hover:scale-[1.02]"
                        >
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                            {isGeneratingKit ? "Analyzing Markets..." : "Synthesize Growth Kit"}
                          </span>
                        </button>
                        <button 
                          onClick={() => setShowGrowthHub(!showGrowthHub)}
                          className="py-8 bg-white/5 border border-white/5 rounded-[2rem] text-slate-300 hover:bg-white/10 transition-all"
                        >
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                            {showGrowthHub ? "Exit Simulation" : "Enter Playground"}
                          </span>
                        </button>
                      </div>

                      {showGrowthHub && marketingKit && (
                        <section className="bg-indigo-950/40 border border-indigo-500/20 p-10 rounded-[3rem] animate-fade-in">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <div className="space-y-3">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ads</h4>
                               <div className="p-4 bg-white/5 rounded-xl text-[11px] text-slate-300 border border-white/5">{marketingKit.social_ads}</div>
                             </div>
                             <div className="space-y-3">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Landing</h4>
                               <div className="p-4 bg-white/5 rounded-xl text-[11px] text-slate-300 border border-white/5">{marketingKit.landing_page}</div>
                             </div>
                             <div className="space-y-3">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Emails</h4>
                               <div className="p-4 bg-white/5 rounded-xl text-[11px] text-slate-300 border border-white/5">{marketingKit.email_sequence}</div>
                             </div>
                          </div>
                        </section>
                      )}

                      {/* SIMULATOR */}
                      <section className="bg-slate-900 border border-white/5 rounded-[3rem] overflow-hidden">
                        <div className="p-10 space-y-8">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-b border-white/5 pb-6">Simulation Interface</h3>
                          <div className="h-[300px] overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                            {testMessages.length === 0 && <p className="text-center text-slate-700 text-xs font-bold uppercase tracking-widest mt-20">Awaiting Signal...</p>}
                            {testMessages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 border border-white/5'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                            {isTesting && <div className="text-[10px] font-black text-indigo-500 animate-pulse">SYNTHESIZING...</div>}
                            <div ref={chatEndRef} />
                          </div>
                          <form onSubmit={handleRunTest} className="flex gap-4">
                            <input 
                              type="text" 
                              placeholder="Test user input..."
                              value={testInput}
                              onChange={(e) => setTestInput(e.target.value)}
                              className="flex-1 bg-black/40 border border-white/5 text-white text-xs rounded-xl px-5 py-4 outline-none"
                            />
                            <button type="submit" disabled={isTesting || !testInput.trim()} className="bg-white text-black px-8 rounded-xl font-black text-[10px] uppercase">Run</button>
                          </form>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/5 rounded-[4rem] animate-fade-in">
                      <div className="w-20 h-20 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center mb-10">
                        <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <h3 className="font-black text-2xl text-white tracking-tighter uppercase italic">Engine Idle</h3>
                      <p className="text-slate-500 max-w-[280px] mt-4 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">Configure parameters to generate an architectural AI blueprint.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-12 animate-fade-in">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">The Vault.</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Local Synchronization Shard</p>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search Vault..." 
                    className="w-full sm:w-80 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-white outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white/5 p-8 rounded-[3rem] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group" 
                      onClick={() => {
                        setForm(item.input);
                        setOutput(item.output);
                        setActiveTab('build');
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-3 py-1 bg-white text-black text-[9px] font-black rounded-full uppercase">{item.input.target_AI}</span>
                        <span className="text-[10px] text-slate-600 font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-black text-white text-base line-clamp-2 mb-4 uppercase italic tracking-tight">{item.input.high_level_goal}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed font-mono">{item.output.FINAL_PROMPT}</p>
                    </div>
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-700 uppercase font-black tracking-widest text-xs">Zero results in shard.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dev' && (
              <div className="space-y-12 animate-fade-in">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Console.</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Local Kernel Execution History</p>
                </div>
                
                <div className="bg-black border border-white/5 rounded-[2rem] overflow-hidden">
                  <div className="p-10 font-mono text-[11px] space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-6 border-b border-white/5 pb-4 last:border-0">
                        <span className="text-slate-700 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-indigo-500 font-bold shrink-0">{log.type}</span>
                        <span className={`font-black shrink-0 ${log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{log.status}</span>
                        <span className="text-slate-500 truncate">data: {JSON.stringify(log.payload)}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-slate-800 italic">No kernel logs recorded in this session.</p>}
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