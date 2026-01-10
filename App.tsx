
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

// --- AUDIO UTILS ---
const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'build' | 'history' | 'dev' | 'voice'>('build');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [backendHealth, setBackendHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  
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

  // --- PLAYGROUND & VOICE STATE ---
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<{role:'user'|'assistant', content:string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const audioContexts = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const liveSession = useRef<any>(null);
  const sources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTime = useRef(0);

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
        setBackendHealth('online');
      } catch (e) {
        setBackendHealth('offline');
      }
    };

    fetchBackendData();
    const interval = setInterval(fetchBackendData, 15000); 
    return () => clearInterval(interval);
  }, []);

  // --- VOICE LAB LOGIC ---
  const startVoiceLab = async () => {
    if (isVoiceActive) {
      stopVoiceLab();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContexts.current = { input: inCtx, output: outCtx };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
            setIsVoiceActive(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64) {
              nextStartTime.current = Math.max(nextStartTime.current, outCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              source.start(nextStartTime.current);
              nextStartTime.current += buffer.duration;
              sources.current.add(source);
              source.onended = () => sources.current.delete(source);
            }
            if (message.serverContent?.outputTranscription) {
              setVoiceTranscripts(prev => [...prev.slice(-10), `Architect: ${message.serverContent?.outputTranscription?.text}`]);
            }
          },
          onerror: (e) => console.error("Voice Engine Error:", e),
          onclose: () => setIsVoiceActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are a professional Prompt Architect Voice Assistant. Help the user refine their high-level goal into a precise description. Be concise and professional.'
        }
      });
      liveSession.current = sessionPromise;
    } catch (err) {
      setError("Microphone access denied or voice service offline.");
    }
  };

  const stopVoiceLab = () => {
    liveSession.current?.then((s: any) => s.close());
    audioContexts.current?.input.close();
    audioContexts.current?.output.close();
    sources.current.forEach(s => s.stop());
    setIsVoiceActive(false);
  };

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
    setError(null);
    try {
      const result = await backendService.createCheckoutSession('Architect', 49);
      if (result.url && result.url !== '#error') {
        window.location.href = result.url;
      } else {
        throw new Error("Payment node disconnected.");
      }
    } catch (err: any) {
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
      saveToVault({ id: `arch_${Date.now()}`, timestamp: Date.now(), input: { ...form }, output: { ...result } });
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages, voiceTranscripts]);

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
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">V4.0 Quantum Suite</p>
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
          <button 
            onClick={startVoiceLab}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isVoiceActive ? 'bg-white' : 'bg-slate-600'}`}></div>
            {isVoiceActive ? 'Voice Active' : 'Consultant'}
          </button>
          <div className="hidden sm:flex flex-col items-end">
             <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${backendHealth === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] font-black text-indigo-400 font-mono tracking-tighter uppercase">SYSTEM: {backendHealth}</span>
             </div>
          </div>
          <button onClick={handleUpgrade} disabled={loading} className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            License
          </button>
        </div>
      </header>

      {/* VOICE OVERLAY */}
      {isVoiceActive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center p-10 animate-fade-in">
          <div className="max-w-2xl w-full space-y-12 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse scale-150"></div>
              <div className="relative w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center border-8 border-indigo-500/30 shadow-2xl">
                <div className="flex gap-2 items-center">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-1.5 bg-white rounded-full animate-bounce" style={{ height: `${20 + Math.random() * 50}px`, animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Brainstorming...</h2>
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.5em]">Quantum Voice Synchronization</p>
            </div>
            <div className="h-48 overflow-y-auto space-y-4 bg-black/60 p-8 rounded-[2rem] border border-white/5 text-left custom-scrollbar shadow-inner">
              {voiceTranscripts.length === 0 && <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest text-center py-10">Listening for seed thoughts...</p>}
              {voiceTranscripts.map((t, i) => (
                <p key={i} className="text-xs text-slate-300 font-medium animate-fade-in py-2 border-b border-white/5 last:border-0">{t}</p>
              ))}
              <div ref={chatEndRef} />
            </div>
            <button onClick={stopVoiceLab} className="px-16 py-4 bg-white text-black font-black uppercase text-[11px] rounded-2xl hover:bg-slate-200 transition-all shadow-2xl">Terminate</button>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 lg:p-10">
            {activeTab === 'build' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* CONFIGURATION PANEL */}
                <div className="lg:col-span-4 space-y-6">
                  <section className="bg-[#0e1014]/90 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in backdrop-blur-xl">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                        <h2 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest italic">Seed Configuration</h2>
                        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Active Link</span>
                      </div>
                      
                      <TextArea 
                        label="Description" 
                        placeholder="e.g. Design a 7-email onboarding sequence for a B2B SaaS..."
                        value={simpleDesc}
                        onChange={(e) => setSimpleDesc(e.target.value)}
                        className="bg-black/50 border-white/10 text-white text-xs min-h-[140px] focus:border-indigo-500/50 transition-all"
                      />
                      
                      <button 
                        onClick={handleMagicFill}
                        disabled={isMagicFilling || !simpleDesc}
                        className="w-full py-4 bg-indigo-600/5 hover:bg-indigo-600/15 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition-all active:scale-95"
                      >
                        {isMagicFilling ? "Inferring Matrix..." : "✨ Infer Architectural Parameters"}
                      </button>
                    </div>

                    <div className="mt-10 space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <Select label="Platform" name="target_AI" value={form.target_AI} onChange={handleInputChange}>
                          <option value="Gemini 2.0">Gemini 2.0</option>
                          <option value="ChatGPT o3">ChatGPT o3</option>
                          <option value="Claude 3.5">Claude 3.5</option>
                          <option value="Llama 3.1">Llama 3.1</option>
                        </Select>
                        <Select label="Reasoning" name="reasoning_visibility" value={form.reasoning_visibility} onChange={handleInputChange}>
                          <option value="hidden">Hidden</option>
                          <option value="brief">Brief</option>
                          <option value="detailed">Exhaustive</option>
                        </Select>
                      </div>

                      <div className="space-y-5">
                        <TextInput label="Goal Summary" name="high_level_goal" value={form.high_level_goal} onChange={handleInputChange} />
                        <TextInput label="Domain Context" name="domain_context" value={form.domain_context} onChange={handleInputChange} />
                        <div className="grid grid-cols-2 gap-4">
                          <TextInput label="Persona" name="user_persona" value={form.user_persona} onChange={handleInputChange} />
                          <TextInput label="Tone" name="tone_style" value={form.tone_style} onChange={handleInputChange} />
                        </div>
                        <TextArea label="Constraints" name="constraints_and_pitfalls" value={form.constraints_and_pitfalls} onChange={handleInputChange} rows={2} placeholder="Hard limits..." />
                      </div>
                    </div>

                    <div className="mt-12">
                      <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 transition-all text-xs active:scale-[0.97]"
                      >
                        {loading ? "Forging String..." : "Synthesize Architecture"}
                      </button>
                      {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-400 font-bold uppercase text-center leading-relaxed">{error}</div>}
                    </div>
                  </section>
                </div>

                {/* OUTPUT PANEL */}
                <div className="lg:col-span-8 space-y-10">
                  {output ? (
                    <div className="space-y-10 animate-fade-in">
                      {/* PROMPT BOX */}
                      <section className="bg-[#0e1014] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-12 space-y-8">
                          <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">FINAL_PROMPT</h3>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Matrix Optimized for {form.target_AI}</p>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(output.FINAL_PROMPT)}
                              className="px-10 py-4 bg-white text-black text-[11px] font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest shadow-2xl"
                            >
                              {copied ? "Copied to Clipboard" : "Copy Prompt"}
                            </button>
                          </div>
                          <div className="bg-black/80 p-12 rounded-[2.5rem] border border-white/5 text-sm font-medium text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[700px] overflow-y-auto custom-scrollbar select-all shadow-inner">
                            {output.FINAL_PROMPT}
                          </div>
                        </div>

                        {/* ARCHITECT NOTES */}
                        <div className="bg-indigo-600/5 p-12 border-t border-white/5">
                           <div className="grid md:grid-cols-2 gap-12">
                              <div className="space-y-8">
                                <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-4 italic">
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                  Architectural Logic
                                </h4>
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
                                  <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-4 italic">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                    Atmosphere Rendering
                                  </h4>
                                  <div className="relative group overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl">
                                    <img src={generatedVisualUrl} alt="Visual Context" className="w-full scale-105 group-hover:scale-100 transition-transform duration-1000 grayscale group-hover:grayscale-0" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                       <p className="text-[10px] font-black text-white uppercase tracking-widest">Neural Visualization Applied</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                           </div>
                        </div>
                      </section>

                      {/* SANDBOX TESTER */}
                      <section className="bg-[#0e1014] border border-white/5 rounded-[3rem] p-12 shadow-2xl">
                        <div className="space-y-8">
                          <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Sandbox Terminal</h3>
                            <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold tracking-[0.3em]">Ready for Injection</span>
                          </div>
                          
                          <div className="h-[400px] overflow-y-auto space-y-6 pr-6 custom-scrollbar bg-black/40 p-10 rounded-[2.5rem] border border-white/5">
                            {testMessages.length === 0 && (
                              <div className="flex flex-col items-center justify-center h-full opacity-10">
                                <svg className="w-20 h-20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="text-[12px] font-black uppercase tracking-[0.5em]">System Idle</p>
                              </div>
                            )}
                            {testMessages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[13px] leading-relaxed font-medium ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                                  <span className="text-[9px] font-black uppercase mb-2 block opacity-40 tracking-widest">{msg.role}</span>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                            {isTesting && (
                              <div className="flex gap-3 items-center text-[10px] font-black text-indigo-500 animate-pulse uppercase tracking-[0.2em]">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                Processing Input Sequence...
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>

                          <form onSubmit={handleRunTest} className="flex gap-6">
                            <input 
                              type="text" 
                              placeholder="Inject test command..."
                              value={testInput}
                              onChange={(e) => setTestInput(e.target.value)}
                              className="flex-1 bg-black/50 border border-white/10 text-white text-sm rounded-2xl px-8 py-5 outline-none focus:border-indigo-500 transition-all shadow-inner"
                            />
                            <button 
                              type="submit" 
                              disabled={isTesting || !testInput.trim()} 
                              className="bg-white text-black px-12 rounded-2xl font-black text-[11px] uppercase hover:bg-slate-200 transition-all shadow-2xl active:scale-95"
                            >
                              Run
                            </button>
                          </form>
                        </div>
                      </section>

                      {/* GROWTH TOOLS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <button 
                            onClick={handleGenerateKit}
                            disabled={isGeneratingKit}
                            className="group relative h-40 overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3rem] p-10 text-left transition-all hover:scale-[1.03] shadow-2xl"
                          >
                             <div className="relative z-10 flex flex-col h-full justify-between">
                               <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Growth Shard</h4>
                               <p className="text-2xl font-black text-white leading-tight">Generate Marketing Kit</p>
                             </div>
                             <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-125 transition-transform duration-700">
                               <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                             </div>
                          </button>

                          <div className="bg-[#0e1014] border border-white/5 rounded-[3rem] p-10 flex items-center justify-between shadow-xl">
                             <div className="space-y-2">
                               <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Meta Layer</h4>
                               <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">{form.target_AI} | {form.reasoning_visibility} MODE</p>
                               <p className="text-[10px] text-slate-700 font-mono font-bold tracking-tighter">BUILD_ID: ARCH_V4_882</p>
                             </div>
                             <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
                             </div>
                          </div>
                      </div>

                      {marketingKit && (
                         <section className="bg-indigo-950/20 border border-indigo-500/10 p-12 rounded-[4rem] animate-fade-in shadow-2xl">
                            <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] mb-12 text-center italic">Commercial Asset Bundle</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                               {[
                                 { label: 'Ad Copy', content: marketingKit.social_ads },
                                 { label: 'Landing Page', content: marketingKit.landing_page },
                                 { label: 'Emails', content: marketingKit.email_sequence }
                               ].map((asset, i) => (
                                 <div key={i} className="space-y-4 group">
                                   <div className="flex items-center justify-between">
                                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{asset.label}</h4>
                                     <button onClick={() => copyToClipboard(asset.content)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-indigo-400 uppercase">Copy</button>
                                   </div>
                                   <div className="p-6 bg-black/40 rounded-[2rem] text-[12px] text-slate-400 border border-white/5 min-h-[220px] max-h-[400px] overflow-y-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">{asset.content}</div>
                                 </div>
                               ))}
                            </div>
                         </section>
                      )}
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
                      <p className="text-slate-500 max-w-[420px] text-[12px] font-bold uppercase tracking-[0.4em] leading-relaxed opacity-60">Input an architectural seed to initiate high-performance prompt synthesis and growth kit mapping.</p>
                      
                      <div className="mt-20 flex gap-8">
                         <div className="px-10 py-3 border border-white/5 rounded-full text-[10px] font-black uppercase text-slate-700 tracking-[0.5em] shadow-inner">QUANTUM_V4_0</div>
                         <div className="px-10 py-3 border border-white/5 rounded-full text-[10px] font-black uppercase text-slate-700 tracking-[0.5em] shadow-inner">NEURAL_IMAGE_ACTIVE</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-16 animate-fade-in">
                <header className="flex flex-col sm:flex-row items-end justify-between gap-10">
                  <div>
                    <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">The Vault.</h2>
                    <p className="text-[12px] text-indigo-500 font-black uppercase tracking-[0.6em] mt-6">Persistence Shard Synchronization</p>
                  </div>
                  <div className="relative w-full sm:w-[450px]">
                    <input 
                      type="text" 
                      placeholder="Search records..." 
                      className="w-full px-10 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm text-white outline-none focus:border-indigo-500 transition-all pl-16 shadow-2xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {history.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-[#0e1014] p-10 rounded-[3.5rem] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-2xl group relative overflow-hidden" 
                      onClick={() => { setForm(item.input); setOutput(item.output); setActiveTab('build'); }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <span className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">{item.input.target_AI}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-tighter">SYN_CACHE_ID: {item.id.substring(5, 12)}</span>
                      </div>
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter line-clamp-2 group-hover:text-indigo-400 transition-colors leading-tight mb-6">{item.input.high_level_goal}</h4>
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && <div className="col-span-full py-40 text-center opacity-20"><p className="text-[12px] font-black uppercase tracking-[0.5em]">No synchronization fragments found in local vault.</p></div>}
                </div>
              </div>
            )}
            
            {activeTab === 'dev' && (
              <div className="space-y-16 animate-fade-in">
                 <header className="flex flex-col sm:flex-row items-end justify-between gap-10">
                   <div>
                    <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">Console.</h2>
                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.6em] mt-6">Live Production Webhook Pipeline</p>
                  </div>
                  <div className="flex gap-6">
                     <div className="px-10 py-5 bg-black/40 border border-white/5 rounded-[2rem] flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full animate-ping ${backendHealth === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none mb-1">Status</p>
                          <p className="text-sm font-black text-white uppercase italic">{backendHealth}</p>
                        </div>
                     </div>
                  </div>
                </header>
                
                <div className="bg-[#0e1014] border border-white/5 rounded-[4rem] overflow-hidden shadow-2xl relative">
                  <div className="p-12 font-mono text-[12px] space-y-4 max-h-[650px] overflow-y-auto custom-scrollbar">
                    {logs.length > 0 ? logs.map(log => (
                      <div key={log.id} className="py-5 border-b border-white/5 flex gap-12 opacity-50 hover:opacity-100 transition-all group">
                        <span className="text-indigo-500 font-bold shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-white uppercase font-black shrink-0 tracking-widest italic">{log.type}</span>
                        <span className="text-slate-600 truncate group-hover:text-slate-300 transition-colors">HEX_PACKET: {JSON.stringify(log.payload)}</span>
                      </div>
                    )) : (
                      <div className="py-60 text-center space-y-12">
                         <div className="relative inline-block">
                           <div className="w-6 h-6 bg-indigo-500/10 rounded-full animate-ping absolute inset-0"></div>
                           <div className="w-6 h-6 bg-indigo-500 rounded-full relative shadow-[0_0_30px_rgba(99,102,241,0.5)]"></div>
                         </div>
                         <div className="space-y-4">
                            <p className="text-xl font-black text-white italic uppercase tracking-[0.5em]">Awaiting Uplink...</p>
                            <p className="text-[11px] text-slate-700 font-bold uppercase tracking-widest max-w-[450px] mx-auto leading-relaxed">System listening for Stripe production signals. Verify STRIPE_WEBHOOK_SECRET on your Render deployment.</p>
                         </div>
                      </div>
                    )}
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
