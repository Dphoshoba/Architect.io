
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";
import { PromptInput, PromptOutput, MarketingKit } from './types';
import { TextInput, TextArea, Select } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  testArchitectedPrompt, 
  magicFillMetaInputs, 
  generateVisualImage,
  generateMarketingKit
} from './services/geminiService';

const DEMO_USER_ID = "user_architect_123"; // In a real app, get this from an auth provider like Clerk

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'history' | 'dev'>('build');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Convex Real-Time Data
  const history = useQuery(api.functions.getHistory, { userId: DEMO_USER_ID }) || [];
  const userStatus = useQuery(api.functions.getUserStatus, { userId: DEMO_USER_ID });
  const logs = useQuery(api.functions.getLogs) || [];
  const apiKeys = useQuery(api.functions.getApiKeys) || [];
  const saveToVault = useMutation(api.functions.savePrompt);

  const [simpleDesc, setSimpleDesc] = useState('');
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [generatedVisualUrl, setGeneratedVisualUrl] = useState<string | null>(null);

  // Growth Hub State
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [marketingKit, setMarketingKit] = useState<MarketingKit | null>(null);
  const [showGrowthHub, setShowGrowthHub] = useState(false);

  // Playground State
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
      setError("High Level Goal is required.");
      return;
    }
    if (userStatus && userStatus.creditsRemaining < 25) {
      setError("Insufficient credits. Please upgrade your plan.");
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

      // Persist to Convex (Real-time update for Vault and Credits)
      await saveToVault({
        userId: DEMO_USER_ID,
        input: form,
        output: result
      });

      if (form.visual_inspiration_mode && result.VISUAL_INSPIRATION_PROMPT) {
        generateVisualImage(result.VISUAL_INSPIRATION_PROMPT).then(setGeneratedVisualUrl).catch(console.error);
      }
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
      const kit = await generateMarketingKit(output.FINAL_PROMPT, form.high_level_goal, form.language);
      setMarketingKit(kit);
      setShowGrowthHub(true);
    } catch (e) {
      setError("Failed to generate Growth Kit.");
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
    if (!searchTerm.trim()) return history;
    return history.filter(h => h.input.high_level_goal.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [history, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* SIDEBAR */}
      <aside className="w-full lg:w-[450px] bg-[#11141b] border-r border-white/5 flex flex-col h-screen sticky top-0 z-50 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-2xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase">Architect.io</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${userStatus ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {userStatus ? 'Convex Cloud Connected' : 'Connecting to Cloud...'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl">
            {(['build', 'history', 'dev'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {activeTab === 'build' ? (
            <>
              <div className="bg-[#161a23] rounded-3xl p-6 border border-white/5 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Architect Neural Seed</span>
                <textarea value={simpleDesc} onChange={e => setSimpleDesc(e.target.value)} placeholder="Describe the task..." className="w-full bg-transparent border-none text-sm placeholder:text-slate-600 focus:ring-0 resize-none min-h-[60px]" />
                <button onClick={handleMagicFill} disabled={isMagicFilling || !simpleDesc.trim()} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  {isMagicFilling ? "Scanning..." : "Auto-Architect"}
                </button>
              </div>

              <div className="space-y-6">
                <Select label="Platform" name="target_AI" value={form.target_AI} onChange={handleInputChange}>
                  <option value="Gemini 2.0">Gemini 2.0</option>
                  <option value="ChatGPT o3">ChatGPT o3</option>
                  <option value="Claude 3.5">Claude 3.5</option>
                  <option value="Llama 3.1">Llama 3.1</option>
                </Select>
                <TextArea label="High Level Goal" name="high_level_goal" value={form.high_level_goal} onChange={handleInputChange} />
                <div className="grid grid-cols-2 gap-4">
                  <TextInput label="Persona" name="user_persona" value={form.user_persona} onChange={handleInputChange} />
                  <TextInput label="Audience" name="audience_persona" value={form.audience_persona} onChange={handleInputChange} />
                </div>
                <TextArea label="Constraints" name="constraints_and_pitfalls" value={form.constraints_and_pitfalls} onChange={handleInputChange} />
              </div>
            </>
          ) : activeTab === 'history' ? (
            <div className="space-y-4">
              <input type="text" placeholder="Search Vault..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-sm" />
              {filteredHistory.map(item => (
                <button key={item._id} onClick={() => { setForm(item.input); setOutput(item.output); setActiveTab('build'); }} className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-600/20 transition-all">
                  <p className="text-xs font-bold line-clamp-1">{item.input.high_level_goal}</p>
                  <p className="text-[8px] font-black uppercase text-slate-500 mt-1">{item.input.target_AI} • {new Date(item.timestamp).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Architect Credits</p>
                <p className="text-2xl font-black">{userStatus?.creditsRemaining ?? '...'}</p>
                <p className="text-[8px] font-black uppercase text-slate-500">/ {userStatus?.totalCredits ?? '...'} total</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cloud Event Logs</h4>
                {logs.map(log => (
                   <div key={log._id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-[9px] font-mono">
                      <div className="flex justify-between text-indigo-400 mb-1">
                        <span>{log.type}</span>
                        <span className="text-green-500">{log.status}</span>
                      </div>
                      <div className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-[#11141b]/80">
          <button onClick={handleGenerate} disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl disabled:opacity-50">
            {loading ? "Architecting..." : "Deploy Blueprint"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-[#0a0c10] p-8 lg:p-20">
        {output ? (
          <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Master Output</span>
                <h2 className="text-6xl font-black text-white tracking-tighter leading-none">Blueprint Ready.</h2>
              </div>
              <div className="flex gap-4">
                <button onClick={handleGenerateKit} disabled={isGeneratingKit} className="px-8 py-4 bg-white/5 hover:bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all">
                  {isGeneratingKit ? "Generating Kit..." : "Growth Hub"}
                </button>
                <button onClick={() => copyToClipboard(output.FINAL_PROMPT)} className="px-10 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                  {copied ? 'Copied' : 'Copy Primary String'}
                </button>
              </div>
            </header>

            {showGrowthHub && marketingKit && (
              <section className="bg-indigo-600 rounded-[3rem] p-10 lg:p-16 shadow-2xl space-y-10">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-100">Market Launch Kit</span>
                  <div className="h-px flex-1 bg-white/20"></div>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="bg-white/10 p-8 rounded-3xl border border-white/10 space-y-4">
                    <h4 className="font-black text-xs uppercase text-indigo-100">Social Ads</h4>
                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{marketingKit.social_ads}</p>
                  </div>
                  <div className="bg-white/10 p-8 rounded-3xl border border-white/10 space-y-4">
                    <h4 className="font-black text-xs uppercase text-indigo-100">Landing Page</h4>
                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{marketingKit.landing_page}</p>
                  </div>
                  <div className="bg-white/10 p-8 rounded-3xl border border-white/10 space-y-4">
                    <h4 className="font-black text-xs uppercase text-indigo-100">Email Sequence</h4>
                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{marketingKit.email_sequence}</p>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-[#11141b] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
               <div className="p-12 lg:p-20 border-b border-white/5">
                  <pre className="text-xl leading-relaxed font-mono text-slate-300 whitespace-pre-wrap">{output.FINAL_PROMPT}</pre>
               </div>
               <div className="p-10 bg-indigo-600/5 grid lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Architect Notes</h4>
                    <ul className="space-y-3">
                      {output.NOTES_FOR_HUMAN_PROMPT_ENGINEER?.map((note, i) => (
                        <li key={i} className="text-xs text-slate-400 flex gap-3"><span className="text-indigo-500 font-black">0{i+1}.</span>{note}</li>
                      ))}
                    </ul>
                  </div>
                  {generatedVisualUrl && (
                    <img src={generatedVisualUrl} className="w-full aspect-video object-cover rounded-3xl border border-white/10 shadow-lg" alt="Concept" />
                  )}
               </div>
            </section>

            <section className="bg-[#161a23] rounded-[3rem] border border-white/5 p-12 lg:p-20 shadow-2xl flex flex-col h-[600px]">
               <div className="flex items-center gap-4 mb-10"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Simulator</span><div className="h-px flex-1 bg-white/5"></div></div>
               <div className="flex-1 overflow-y-auto space-y-8 mb-10 pr-4 custom-scrollbar">
                 {testMessages.map((m, i) => (
                   <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-8 rounded-[2rem] text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 border border-white/5'}`}>{m.content}</div>
                   </div>
                 ))}
                 {isTesting && <div className="text-[10px] font-black text-indigo-500 animate-pulse uppercase tracking-widest">Processing...</div>}
                 <div ref={chatEndRef} />
               </div>
               <form onSubmit={handleRunTest} className="relative">
                 <textarea value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="Simulate user input..." className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-8 py-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none" rows={1} />
                 <button type="submit" disabled={!testInput.trim() || isTesting} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-indigo-600 text-white rounded-full shadow-lg disabled:opacity-30"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
               </form>
            </section>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full">
             <div className="w-32 h-32 border-[6px] border-indigo-500/10 border-t-indigo-600 rounded-[3rem] animate-spin"></div>
             <p className="mt-12 text-2xl font-black text-white uppercase tracking-[0.2em] animate-pulse">Constructing Blueprint...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-12 h-full">
             <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mb-8">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
             </div>
             <h1 className="text-7xl lg:text-9xl font-black text-white tracking-tighter leading-[0.8] uppercase">Architect Master.</h1>
             <p className="text-xl text-slate-500 font-medium max-w-2xl">The expert engine for high-performance prompt engineering. Real-time Cloud Connected.</p>
             <button onClick={() => setActiveTab('build')} className="px-12 py-6 bg-white text-black font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl">Start Architecting</button>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
