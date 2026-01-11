
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

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", 
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Bengali", "Turkish", "Vietnamese", 
  "Polish", "Ukrainian", "Thai", "Persian", "Romanian", "Greek", "Czech", "Hungarian", 
  "Swedish", "Indonesian", "Hebrew", "Danish", "Finnish", "Norwegian", "Slovak", 
  "Croatian", "Bulgarian", "Lithuanian", "Slovenian"
];

// --- AUDIO UTILS FOR VOICE LAB ---
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
  const [activeTab, setActiveTab] = useState<'build' | 'history' | 'dev'>('build');
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [sysError, setSysError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [backendHealth, setBackendHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
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
  const [visualContext, setVisualContext] = useState<string | null>(null);

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
    const savedVault = localStorage.getItem('architect_vault_v4');
    if (savedVault) setHistory(JSON.parse(savedVault));

    // Handle Stripe Success Redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 8000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

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
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
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
          onerror: (e) => stopVoiceLab(),
          onclose: () => setIsVoiceActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are an elite Prompt Consultant. Help the user refine their high-level vision into architectural requirements. Be sharp, professional, and technical.'
        }
      });
      liveSession.current = sessionPromise;
    } catch (err) {
      setGenError("Voice Module Initialization Failed.");
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
    localStorage.setItem('architect_vault_v4', JSON.stringify(updated));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVisualContext(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setSysError(null);
    try {
      const result = await backendService.createCheckoutSession('Architect', 49);
      if (result.url) window.location.href = result.url;
      else throw new Error("Link failed.");
    } catch (err: any) {
      setSysError("License Node Unavailable. Ensure server.js is deployed.");
      setLoading(false);
    }
  };

  const handleMagicFill = async () => {
    if (!simpleDesc.trim() && !visualContext) return;
    setIsMagicFilling(true);
    try {
      const suggested = await magicFillMetaInputs(simpleDesc, form.language, visualContext || undefined);
      setForm(prev => ({ ...prev, high_level_goal: simpleDesc, ...suggested }));
    } finally {
      setIsMagicFilling(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.high_level_goal.trim()) {
      setGenError("Objective seed is required.");
      return;
    }
    setLoading(true);
    setGenError(null);
    setGeneratedVisualUrl(null);
    setMarketingKit(null);
    try {
      const finalForm = { ...form, base64Image: visualContext || undefined };
      const result = await generateArchitectPrompt(finalForm);
      setOutput(result);
      saveToVault({ id: `arch_${Date.now()}`, timestamp: Date.now(), input: { ...finalForm }, output: { ...result } });
      setUserStatus(prev => ({ ...prev, creditsRemaining: Math.max(0, prev.creditsRemaining - 1) }));
      if (form.visual_inspiration_mode && result.VISUAL_INSPIRATION_PROMPT) {
        generateVisualImage(result.VISUAL_INSPIRATION_PROMPT).then(setGeneratedVisualUrl).catch(console.error);
      }
    } catch (err: any) {
      setGenError(err.message || "Matrix Synthesis failed.");
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
      setGenError("Marketing shard failed.");
    } finally {
      setIsGeneratingKit(false);
    }
  };

  const handleExport = () => {
    if (!output?.FINAL_PROMPT) return;
    const element = document.createElement("a");
    const file = new Blob([output.FINAL_PROMPT], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `architect_prompt_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
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
      {/* SUCCESS NOTIFICATION */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
          <div className="bg-indigo-600 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-indigo-400/30">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-white italic">Enterprise Node Activated. Credits Refilled.</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex-none h-16 border-b border-white/5 bg-[#050608]/90 backdrop-blur-xl flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-white uppercase italic">Architect.io</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">V4.0 Quantum Suite</p>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <nav className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {(['build', 'history', 'dev'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={startVoiceLab} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
            <div className={`w-2 h-2 rounded-full ${isVoiceActive ? 'bg-white' : 'bg-slate-600'}`}></div>
            {isVoiceActive ? 'Voice Active' : 'Consultant'}
          </button>
          <div className="hidden sm:flex flex-col items-end">
             <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${backendHealth === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] font-black text-indigo-400 font-mono tracking-tighter uppercase">{backendHealth}</span>
             </div>
          </div>
          <button onClick={() => setShowUpgradeModal(true)} className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all shadow-xl shadow-white/10">License</button>
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
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.5em]">Live Neural Uplink Active</p>
            </div>
            <div className="h-48 overflow-y-auto space-y-4 bg-black/60 p-8 rounded-[2rem] border border-white/5 text-left custom-scrollbar shadow-inner font-mono text-xs">
              {voiceTranscripts.length === 0 && <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest text-center py-10 italic">Awaiting conceptual signals...</p>}
              {voiceTranscripts.map((t, i) => <p key={i} className="text-slate-300 animate-fade-in py-2 border-b border-white/5 last:border-0">{t}</p>)}
              <div ref={chatEndRef} />
            </div>
            <button onClick={stopVoiceLab} className="px-16 py-4 bg-white text-black font-black uppercase text-[11px] rounded-2xl hover:bg-slate-200 transition-all shadow-2xl">Terminate Session</button>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#0e1014] border border-white/5 max-w-lg w-full rounded-[3rem] p-12 shadow-2xl relative">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center space-y-8">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Growth Access</h2>
              <p className="text-slate-500 text-xs uppercase tracking-[0.2em] leading-relaxed">Scale your synthesis with Enterprise persistence and Growth Kit engines.</p>
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-4">
                 <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-indigo-400 italic">
                    <span>Professional Tier</span>
                    <span>$49 / MO</span>
                 </div>
                 <ul className="text-left text-[10px] text-slate-600 space-y-3 uppercase font-bold tracking-widest">
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> 10,000 Synthesis Credits</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Vision Uplink Analysis</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> CMO Marketing Shards</li>
                 </ul>
              </div>
              {sysError && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[9px] text-rose-500 font-black uppercase leading-relaxed tracking-widest">{sysError}</div>}
              <button onClick={handleUpgrade} disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-indigo-600/30">
                {loading ? "Linking..." : "Initialize Upgrade"}
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
                      
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 italic">Vision Context Shard</label>
                        {!visualContext ? (
                          <div className="group relative border-2 border-dashed border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 transition-all cursor-pointer bg-white/2 hover:bg-white/5">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-8 h-8 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Inject UI/Moodboard</span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30">
                            <img src={visualContext} alt="Context" className="w-full h-32 object-cover grayscale-50" />
                            <button onClick={() => setVisualContext(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-lg"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        )}
                      </div>

                      <TextArea label="Objective Seed" placeholder="Describe the outcome you want to architect..." value={simpleDesc} onChange={(e) => setSimpleDesc(e.target.value)} className="bg-black/50 border-white/10 text-white text-xs min-h-[120px]" />
                      <button onClick={handleMagicFill} disabled={isMagicFilling || (!simpleDesc && !visualContext)} className="w-full py-4 bg-indigo-600/5 hover:bg-indigo-600/15 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition-all">
                        {isMagicFilling ? "Inferring Matrix..." : "✨ Matrix Auto-Fill"}
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
                        <Select label="Language Matrix" name="language" value={form.language} onChange={handleInputChange}>
                          {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </Select>
                      </div>

                      <div className="space-y-5">
                        <TextInput label="Goal Summary" name="high_level_goal" value={form.high_level_goal} onChange={handleInputChange} />
                        <TextInput label="Audience Persona" name="audience_persona" value={form.audience_persona} onChange={handleInputChange} />
                        <div className="grid grid-cols-2 gap-4">
                          <TextInput label="User Persona" name="user_persona" value={form.user_persona} onChange={handleInputChange} />
                          <TextInput label="Tone & Voice" name="tone_style" value={form.tone_style} onChange={handleInputChange} />
                        </div>
                        <TextArea label="Few-Shot Fragments" name="few_shot_examples" value={form.few_shot_examples} onChange={handleInputChange} placeholder="Paste example outputs here..." />
                        <TextArea label="Static Resources" name="static_resources" value={form.static_resources} onChange={handleInputChange} placeholder="Links, data points, or source docs..." />
                        <TextArea label="Constraints/Pitfalls" name="constraints_and_pitfalls" value={form.constraints_and_pitfalls} onChange={handleInputChange} rows={2} />
                      </div>
                    </div>

                    <div className="mt-12">
                      <button onClick={handleGenerate} disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 transition-all text-xs">
                        {loading ? "Forging..." : "Synthesize Matrix"}
                      </button>
                      {genError && <p className="mt-4 text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center">{genError}</p>}
                    </div>
                  </section>
                </div>

                {/* OUTPUT PANEL */}
                <div className="lg:col-span-8 space-y-10">
                  {output ? (
                    <div className="space-y-10 animate-fade-in">
                      <section className="bg-[#0e1014] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-12 space-y-8">
                          <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">FINAL_PROMPT</h3>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Specialized for {form.target_AI} ({form.language})</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={handleExport} className="px-6 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black rounded-xl hover:bg-white/10 uppercase tracking-widest transition-all">Export MD</button>
                                <button onClick={() => copyToClipboard(output.FINAL_PROMPT)} className="px-10 py-4 bg-white text-black text-[11px] font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest shadow-2xl">
                                  {copied ? "Copied" : "Copy String"}
                                </button>
                            </div>
                          </div>
                          <div className="bg-black/80 p-12 rounded-[2.5rem] border border-white/5 text-sm font-medium text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[700px] overflow-y-auto custom-scrollbar select-all shadow-inner">
                            {output.FINAL_PROMPT}
                          </div>
                        </div>

                        <div className="bg-indigo-600/5 p-12 border-t border-white/5">
                           <div className="grid md:grid-cols-2 gap-12">
                              <div className="space-y-8">
                                <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">Architectural Reasoning</h4>
                                <ul className="space-y-4">
                                  {output.NOTES_FOR_HUMAN_PROMPT_ENGINEER?.map((note, i) => (
                                    <li key={i} className="text-[12px] text-slate-400 flex gap-5 bg-white/5 p-5 rounded-3xl border border-white/5 group">
                                      <span className="text-indigo-500 font-black group-hover:scale-110 transition-transform">L_{i+1}</span>
                                      <span>{note}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {generatedVisualUrl && (
                                <div className="space-y-8">
                                  <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">Neural Result Preview</h4>
                                  <div className="relative group overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl">
                                    <img src={generatedVisualUrl} alt="Visual Outcome" className="w-full grayscale group-hover:grayscale-0 transition-all duration-1000" />
                                  </div>
                                </div>
                              )}
                           </div>
                        </div>
                      </section>

                      {/* GROWTH ENGINE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <button onClick={handleGenerateKit} disabled={isGeneratingKit} className="group h-44 overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3rem] p-10 text-left transition-all hover:scale-[1.03] shadow-2xl relative">
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Launch Shard</p>
                            <p className="text-3xl font-black text-white mt-2 italic tracking-tighter">Generate Marketing Kit</p>
                            <svg className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         </button>
                         <div className="bg-[#0e1014] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between shadow-xl relative overflow-hidden">
                            <div className="space-y-2">
                               <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Synthesis Meta</h4>
                               <p className="text-xl font-black text-white uppercase italic tracking-tighter">{form.target_AI}</p>
                               <p className="text-sm text-slate-500 font-bold uppercase">{form.language} MATRIX</p>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                               <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div></div>
                               <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Active Credits: {userStatus.creditsRemaining}</span>
                            </div>
                         </div>
                      </div>

                      {marketingKit && (
                        <section className="bg-indigo-950/20 border border-indigo-500/10 p-12 rounded-[4rem] animate-fade-in shadow-2xl">
                          <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] mb-12 text-center italic">Commercial Growth Assets</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {[
                              { label: 'Social Ad Blueprint', content: marketingKit.social_ads },
                              { label: 'Landing Page Shard', content: marketingKit.landing_page },
                              { label: 'Email Drip Sequence', content: marketingKit.email_sequence }
                            ].map((asset, i) => (
                              <div key={i} className="space-y-4 group">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{asset.label}</h4>
                                    <button onClick={() => copyToClipboard(asset.content)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold text-indigo-500 uppercase">Copy</button>
                                </div>
                                <div className="p-6 bg-black/40 rounded-[2rem] text-[12px] text-slate-400 border border-white/5 min-h-[220px] max-h-[400px] overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed select-all">{asset.content}</div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  ) : (
                    <div className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-16 bg-[#0e1014]/60 border border-white/5 rounded-[5rem] animate-fade-in backdrop-blur-xl group">
                      <div className="w-32 h-32 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-[3.5rem] flex items-center justify-center shadow-2xl border-4 border-white/5 mb-14 group-hover:scale-105 transition-transform duration-700">
                        <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <h3 className="font-black text-5xl text-white tracking-tighter uppercase italic mb-8">Architect Standby.</h3>
                      <p className="text-slate-500 max-w-[420px] text-[12px] font-bold uppercase tracking-[0.4em] leading-relaxed opacity-60">Initialize an objective seed or inject a vision shard to begin high-performance synthesis.</p>
                      <div className="mt-16 flex gap-4">
                         <div className="px-8 py-2 border border-white/5 rounded-full text-[9px] font-black uppercase text-slate-700 tracking-widest shadow-inner">MULTI_MODEL_SYNC</div>
                         <div className="px-8 py-2 border border-white/5 rounded-full text-[9px] font-black uppercase text-slate-700 tracking-widest shadow-inner">35_LANGUAGE_MATRIX</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-16 animate-fade-in">
                <header className="flex flex-col sm:flex-row items-end justify-between gap-10">
                  <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">The Vault.</h2>
                  <div className="relative w-full sm:w-[450px]">
                    <input type="text" placeholder="Search architectural history..." className="w-full px-10 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm text-white outline-none focus:border-indigo-500 transition-all pl-16 shadow-2xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <svg className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {history.filter(h => h.input.high_level_goal.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                    <div key={item.id} className="bg-[#0e1014] p-10 rounded-[3.5rem] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-2xl group" onClick={() => { setForm(item.input); setOutput(item.output); setActiveTab('build'); }}>
                      <div className="flex justify-between items-center mb-6">
                        <span className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">{item.input.target_AI}</span>
                        <span className="text-[9px] font-mono text-slate-700 font-bold uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">{item.input.high_level_goal}</h4>
                    </div>
                  ))}
                  {history.length === 0 && <div className="col-span-full py-40 text-center opacity-20"><p className="text-[12px] font-black uppercase tracking-[0.5em]">No synchronization fragments found.</p></div>}
                </div>
              </div>
            )}

            {activeTab === 'dev' && (
              <div className="space-y-16 animate-fade-in">
                <header className="flex flex-row items-end justify-between">
                  <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">Console.</h2>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="bg-[#0e1014] border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl">
                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">Backend Node Diagnostic</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between py-3 border-b border-white/5 text-[10px] font-mono"><span className="text-slate-500 uppercase">Status</span><span className={backendHealth === 'online' ? 'text-emerald-500' : 'text-rose-500'}>{backendHealth.toUpperCase()}</span></div>
                        <div className="flex justify-between py-3 border-b border-white/5 text-[10px] font-mono"><span className="text-slate-500 uppercase">Credits</span><span className="text-white">{userStatus.creditsRemaining}</span></div>
                        <div className="flex justify-between py-3 border-b border-white/5 text-[10px] font-mono"><span className="text-slate-500 uppercase">Environment</span><span className="text-indigo-500">PROD-SYNC</span></div>
                      </div>
                      <p className="text-[10px] text-slate-700 leading-relaxed font-bold uppercase tracking-widest italic">Render Uplink Operational. Ensure STRIPE_WEBHOOK_SECRET is active in environment variables.</p>
                   </div>
                   <div className="bg-[#0e1014] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
                      <div className="p-10 font-mono text-[10px] space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic mb-6">Live Packet Matrix</h4>
                        {logs.length > 0 ? logs.map(log => (
                          <div key={log.id} className="py-4 border-b border-white/5 flex gap-8 items-center group">
                            <span className="text-indigo-500/50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className="text-white font-black italic uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">{log.type}</span>
                            <span className="text-slate-800 text-[8px] truncate">SYNC_ID: {log.id}</span>
                          </div>
                        )) : <div className="text-center py-20 opacity-10 font-black uppercase tracking-widest">Awaiting Packet Ingress...</div>}
                      </div>
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
