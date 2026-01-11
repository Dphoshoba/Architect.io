
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PromptInput, PromptOutput, MarketingKit, UserStatus, HistoryItem, WebhookEvent, TargetAI } from './types';
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

const TARGET_MODELS: TargetAI[] = [
  "Gemini 2.0 Flash", "Gemini 2.0 Pro", "Gemini 1.5 Pro",
  "ChatGPT o3-mini", "ChatGPT o1", "GPT-4o",
  "Claude 3.5 Sonnet", "Claude 3.5 Haiku",
  "DeepSeek R1", "DeepSeek V3",
  "Grok 3",
  "Sora",
  "Nano Banana / Gemini 3 Pro",
  "Adobe Firefly",
  "Imagen 4",
  "Canva",
  "Llama 3.3", "Llama 3.1",
  "Qwen 2.5 Max", "Mistral Large 2", "Cohere Command R+",
  "Generic"
];

const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'build' | 'history' | 'manual' | 'dev'>('build');
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [backendHealth, setBackendHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    plan: "Starter",
    creditsRemaining: 100,
    totalCredits: 100
  });
  
  const [logs, setLogs] = useState<WebhookEvent[]>([]);
  const [simpleDesc, setSimpleDesc] = useState('');
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [generatedVisualUrl, setGeneratedVisualUrl] = useState<string | null>(null);
  const [marketingKit, setMarketingKit] = useState<MarketingKit | null>(null);
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [visualContext, setVisualContext] = useState<string | null>(null);

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<string[]>([]);
  
  const audioContexts = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const liveSession = useRef<any>(null);
  const sources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTime = useRef(0);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 2.0 Flash",
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

  useEffect(() => {
    const saved = localStorage.getItem('architect_vault_v4');
    if (saved) setHistory(JSON.parse(saved));

    const savedStatus = localStorage.getItem('architect_status');
    if (savedStatus) setUserStatus(JSON.parse(savedStatus));

    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      setShowSuccessToast(true);
      setUserStatus(prev => ({ 
        ...prev, 
        plan: "Architect", 
        creditsRemaining: 50000, 
        totalCredits: 50000 
      }));
      setTimeout(() => setShowSuccessToast(false), 8000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const check = async () => {
      try {
        const h = await backendService.checkHealth();
        setBackendHealth(h === 'OK' ? 'online' : 'offline');
        if (h === 'OK') {
          const l = await backendService.getWebhookLogs();
          setLogs(l);
        }
      } catch { setBackendHealth('offline'); }
    };
    check();
    const inv = setInterval(check, 20000);
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    localStorage.setItem('architect_status', JSON.stringify(userStatus));
  }, [userStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onloadend = () => setVisualContext(r.result as string);
      r.readAsDataURL(file);
    }
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const res = await backendService.createCheckoutSession("Architect", 49);
      if (res.url) window.location.href = res.url;
    } catch (e: any) {
      setGenError("Billing Gateway Offline. Ensure backend is deployed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (userStatus.creditsRemaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    if (!form.high_level_goal.trim()) { setGenError("Synthesis seed required."); return; }
    
    setLoading(true); setGenError(null); setGeneratedVisualUrl(null); setMarketingKit(null);
    try {
      const res = await generateArchitectPrompt({ ...form, base64Image: visualContext || undefined });
      setOutput(res);
      
      setUserStatus(prev => ({ ...prev, creditsRemaining: Math.max(0, prev.creditsRemaining - 10) }));

      const hItem = { id: `arch_${Date.now()}`, timestamp: Date.now(), input: { ...form }, output: { ...res } };
      const updatedHistory = [hItem, ...history].slice(0, 50);
      setHistory(updatedHistory);
      localStorage.setItem('architect_vault_v4', JSON.stringify(updatedHistory));
      
      if (form.visual_inspiration_mode && res.VISUAL_INSPIRATION_PROMPT) {
        generateVisualImage(res.VISUAL_INSPIRATION_PROMPT).then(setGeneratedVisualUrl);
      }
    } catch (err: any) { setGenError(err.message || "Synthesis failure."); }
    finally { setLoading(false); }
  };

  const handleMagicFill = async () => {
    if (!simpleDesc && !visualContext) return;
    setIsMagicFilling(true);
    try {
      const suggestions = await magicFillMetaInputs(simpleDesc, form.language, visualContext || undefined);
      setForm(prev => ({ ...prev, ...suggestions }));
    } catch (err) {
      console.error("Magic fill failed", err);
    } finally {
      setIsMagicFilling(false);
    }
  };

  const handleExport = () => {
    if (!output) return;
    const element = document.createElement("a");
    const file = new Blob([output.FINAL_PROMPT], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `architect_prompt_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = async () => {
    if (!output?.FINAL_PROMPT) return;
    const shareData = {
      title: 'Architect.io Generated Prompt',
      text: output.FINAL_PROMPT,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copy(output.FINAL_PROMPT);
        alert("Prompt copied to clipboard! Share it with your team.");
      }
    } catch (err) { console.error("Share error", err); }
  };

  const handleDownloadImage = () => {
    if (!generatedVisualUrl) return;
    const element = document.createElement("a");
    element.href = generatedVisualUrl;
    element.download = `architect_visualization_${Date.now()}.png`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleGenerateKit = async () => {
    if (!output?.FINAL_PROMPT) return;
    setIsGeneratingKit(true);
    try {
      const kit = await generateMarketingKit(output.FINAL_PROMPT, form.high_level_goal, form.language);
      setMarketingKit(kit);
    } finally { setIsGeneratingKit(false); }
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startVoiceLab = async () => {
    if (isVoiceActive) { stopVoiceLab(); return; }
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
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
            setIsVoiceActive(true);
          },
          onmessage: async (m: LiveServerMessage) => {
            const b64 = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (b64) {
              nextStartTime.current = Math.max(nextStartTime.current, outCtx.currentTime);
              const buffer = await decodeAudioData(decode(b64), outCtx, 24000, 1);
              const s = outCtx.createBufferSource();
              s.buffer = buffer;
              s.connect(outCtx.destination);
              s.start(nextStartTime.current);
              nextStartTime.current += buffer.duration;
              sources.current.add(s);
              s.onended = () => sources.current.delete(s);
            }
            if (m.serverContent?.outputTranscription) {
              setVoiceTranscripts(prev => [...prev.slice(-8), `Architect: ${m.serverContent?.outputTranscription?.text}`]);
            }
          },
          onerror: () => stopVoiceLab(),
          onclose: () => setIsVoiceActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are an elite Prompt Architect. Brainstorm with the user.'
        }
      });
      liveSession.current = sessionPromise;
    } catch { setGenError("Voice Module Initialization Failed."); }
  };

  const stopVoiceLab = () => {
    liveSession.current?.then((s: any) => s.close());
    audioContexts.current?.input.close();
    audioContexts.current?.output.close();
    sources.current.forEach(s => s.stop());
    setIsVoiceActive(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-slate-100 font-sans selection:bg-indigo-500/50">
      {/* SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
          <div className="bg-indigo-600 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-indigo-400/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            <p className="text-xs font-black uppercase tracking-widest text-white italic">Professional License Activated. Credits Refilled.</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex-none h-16 border-b border-white/5 bg-[#050608]/90 backdrop-blur-xl flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-white uppercase italic leading-none">Architect.io</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">V4.0 Quantum Suite</p>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <nav className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {['build', 'history', 'manual', 'dev'].map((t: any) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
                {t}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end mr-2">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{userStatus.plan} PLAN</p>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{userStatus.creditsRemaining.toLocaleString()} CREDITS</p>
          </div>
          <button onClick={() => setShowUpgradeModal(true)} className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all shadow-xl shadow-white/10">License</button>
        </div>
      </header>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#0e1014] border border-white/5 max-w-lg w-full rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full"></div>
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center space-y-8 relative z-10">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Growth Access</h2>
              <p className="text-slate-500 text-[11px] uppercase tracking-[0.2em] leading-relaxed font-bold">Scale your synthesis with Enterprise persistence and Marketing Shard engines.</p>
              
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6 text-left">
                 <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-indigo-400 italic">
                    <span>Architect Node</span>
                    <span>$49 / MO</span>
                 </div>
                 <ul className="text-[10px] text-slate-300 space-y-4 uppercase font-bold tracking-[0.2em]">
                    <li className="flex items-center gap-3"><div className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></div> 50,000 Refill Credits</li>
                    <li className="flex items-center gap-3"><div className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></div> Multi-Modal Vision Uplink</li>
                    <li className="flex items-center gap-3"><div className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></div> Commercial Kit Generator</li>
                    <li className="flex items-center gap-3"><div className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></div> Unlimited History Vault</li>
                 </ul>
              </div>
              
              <button onClick={handleUpgrade} disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-indigo-600/30">
                {loading ? "Initializing..." : "Uplink Professional Tier"}
              </button>
              
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Secured by Stripe Node</p>
            </div>
          </div>
        </div>
      )}

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
               <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Voice Laboratory</h2>
               <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.5em]">Live Conceptual Uplink</p>
             </div>
             <div className="h-48 overflow-y-auto space-y-4 bg-black/60 p-8 rounded-[2rem] border border-white/5 text-left custom-scrollbar shadow-inner font-mono text-xs">
               {voiceTranscripts.length === 0 && <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest text-center py-10 italic">Awaiting technical signals...</p>}
               {voiceTranscripts.map((t, i) => <p key={i} className="text-slate-300 animate-fade-in py-2 border-b border-white/5 last:border-0">{t}</p>)}
             </div>
             <button onClick={stopVoiceLab} className="px-16 py-4 bg-white text-black font-black uppercase text-[11px] rounded-2xl hover:bg-slate-200 transition-all">Terminate Stream</button>
           </div>
         </div>
      )}

      {/* MAIN */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 lg:p-10">
            {activeTab === 'build' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                  <section className="bg-[#0e1014]/90 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
                        <h2 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">Matrix Synthesis</h2>
                        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest italic">V4_SYNC</span>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1 italic">Vision Context Shard</label>
                        {!visualContext ? (
                          <div className="group relative border-2 border-dashed border-white/5 hover:border-indigo-500/30 rounded-2xl p-8 transition-all cursor-pointer bg-white/2 hover:bg-white/5">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-10 h-10 text-slate-600 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Uplink UI Context</span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 group">
                            <img src={visualContext} alt="Context" className="w-full h-36 object-cover grayscale-50 group-hover:grayscale-0 transition-all duration-700" />
                            <button onClick={() => setVisualContext(null)} className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-rose-500 text-white rounded-xl transition-all shadow-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-8">
                         <TextArea label="Synthesis Seed" placeholder="Describe the outcome you want to architect..." value={simpleDesc} onChange={(e) => setSimpleDesc(e.target.value)} className="bg-black/50 border-white/10 text-white text-xs min-h-[120px]" />
                         <button onClick={handleMagicFill} disabled={isMagicFilling || (!simpleDesc && !visualContext)} className="w-full py-4 bg-indigo-600/5 hover:bg-indigo-600/15 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition-all italic">
                           {isMagicFilling ? "Inferring Matrix..." : "✨ Matrix Auto-Fill"}
                         </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <Select label="Target Model" name="target_AI" value={form.target_AI} onChange={handleInputChange}>
                            {TARGET_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                         </Select>
                         <Select label="Language Matrix" name="language" value={form.language} onChange={handleInputChange}>
                            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                         </Select>
                      </div>

                      <div className="space-y-6">
                         <TextInput label="Goal Summary" name="high_level_goal" value={form.high_level_goal} onChange={handleInputChange} />
                         <TextInput label="Target Audience" name="audience_persona" value={form.audience_persona} onChange={handleInputChange} />
                         <TextArea label="Few-Shot Fragments" name="few_shot_examples" value={form.few_shot_examples} onChange={handleInputChange} placeholder="Paste examples..." />
                         <TextArea label="Constraints/Pitfalls" name="constraints_and_pitfalls" value={form.constraints_and_pitfalls} onChange={handleInputChange} rows={2} />
                      </div>

                      <div className="pt-6">
                        <button onClick={handleGenerate} disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 transition-all text-xs group italic">
                           {loading ? "Forging..." : "Synthesize Architecture"}
                        </button>
                        {genError && <p className="mt-4 text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center animate-pulse">{genError}</p>}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-8 space-y-10">
                   {output ? (
                      <div className="space-y-10 animate-fade-in">
                        <section className="bg-[#0e1014] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                           <div className="p-12 space-y-8">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">FINAL_PROMPT</h3>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Optimized for {form.target_AI} ({form.language})</p>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <button onClick={handleExport} className="px-5 py-3.5 bg-white/5 border border-white/10 text-white text-[10px] font-black rounded-xl hover:bg-white/10 uppercase tracking-widest transition-all" title="Download MD">MD</button>
                                    <button onClick={handleShare} className="px-5 py-3.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-xl hover:bg-indigo-600/20 uppercase tracking-widest transition-all" title="Share Prompt">Share</button>
                                    <button onClick={() => copy(output.FINAL_PROMPT)} className="px-8 py-3.5 bg-white text-black text-[11px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest shadow-2xl">
                                       {copied ? "Copied" : "Copy"}
                                    </button>
                                 </div>
                              </div>
                              <div className="bg-black/80 p-12 rounded-[2.5rem] border border-white/5 text-sm font-medium text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[700px] overflow-y-auto custom-scrollbar select-all shadow-inner">
                                 {output.FINAL_PROMPT}
                              </div>
                           </div>
                           <div className="bg-indigo-600/5 p-12 border-t border-white/5 grid md:grid-cols-2 gap-12">
                              <div className="space-y-8">
                                 <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">Synthesis Notes</h4>
                                 <ul className="space-y-4">
                                    {output.NOTES_FOR_HUMAN_PROMPT_ENGINEER?.map((n, i) => (
                                       <li key={i} className="text-[12px] text-slate-400 flex gap-5 bg-white/5 p-5 rounded-3xl border border-white/5 group transition-all hover:border-indigo-500/30">
                                          <span className="text-indigo-500 font-black italic">L_{i+1}</span>
                                          <span>{n}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                              {generatedVisualUrl && (
                                 <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest italic">Outcome Visualization</h4>
                                      <button onClick={handleDownloadImage} className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Visual
                                      </button>
                                    </div>
                                    <div className="relative group rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl grayscale-50 hover:grayscale-0 transition-all duration-1000">
                                       <img src={generatedVisualUrl} alt="Visual" className="w-full" />
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-[10px] font-black uppercase tracking-widest text-white">Visual Synthesis Complete</div>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <button onClick={handleGenerateKit} disabled={isGeneratingKit} className="group h-44 overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3rem] p-10 text-left transition-all hover:scale-[1.03] shadow-2xl relative">
                              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Growth Laboratory</p>
                              <p className="text-3xl font-black text-white mt-2 italic tracking-tighter">Generate Marketing Kit</p>
                              <svg className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                           </button>
                           <div className="bg-[#0e1014] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between shadow-xl relative overflow-hidden">
                              <div className="space-y-2">
                                 <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Active Matrix</h4>
                                 <p className="text-xl font-black text-white uppercase italic tracking-tighter">{form.target_AI} NODE</p>
                                 <p className="text-sm text-slate-500 font-bold uppercase">{form.language} CORE</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center"><div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div></div>
                                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Processing Synchronized</span>
                              </div>
                           </div>
                        </div>

                        {marketingKit && (
                          <section className="bg-indigo-950/20 border border-indigo-500/10 p-12 rounded-[4rem] animate-fade-in shadow-2xl">
                             <div className="flex flex-col items-center mb-12">
                               <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] italic">Marketing Shards</h3>
                               <div className="h-px w-20 bg-indigo-500/30 mt-4"></div>
                             </div>
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {[
                                   { l: 'Social Shard', c: marketingKit.social_ads },
                                   { l: 'Landing Shard', c: marketingKit.landing_page },
                                   { l: 'Email Drip Shard', c: marketingKit.email_sequence }
                                ].map((a, i) => (
                                   <div key={i} className="space-y-4 group">
                                      <div className="flex justify-between items-center">
                                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{a.l}</h4>
                                         <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button onClick={() => copy(a.c)} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Copy</button>
                                         </div>
                                      </div>
                                      <div className="p-6 bg-black/40 rounded-[2rem] text-[12px] text-slate-300 border border-white/5 min-h-[220px] whitespace-pre-wrap leading-relaxed select-all custom-scrollbar overflow-y-auto max-h-[400px] font-mono italic">{a.c}</div>
                                   </div>
                                ))}
                             </div>
                          </section>
                        )}
                      </div>
                   ) : (
                      <div className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-16 bg-[#0e1014]/60 border border-white/5 rounded-[5rem] backdrop-blur-xl group relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full group-hover:bg-indigo-600/10 transition-colors"></div>
                        <div className="w-32 h-32 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-[3.5rem] flex items-center justify-center shadow-2xl border-4 border-white/5 mb-14 group-hover:scale-110 transition-transform duration-700 relative z-10">
                          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="font-black text-5xl text-white tracking-tighter uppercase italic mb-8 relative z-10">Architect Standby.</h3>
                        <p className="text-slate-500 max-w-[420px] text-[12px] font-bold uppercase tracking-[0.4em] leading-relaxed opacity-60 relative z-10">Initialize an objective seed or uplink a vision shard to begin high-performance synthesis.</p>
                      </div>
                   )}
                </div>
              </div>
            )}
            
            {activeTab === 'manual' && (
              <div className="space-y-20 animate-fade-in max-w-5xl mx-auto py-10">
                <header className="space-y-6 text-center">
                  <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">The Academy.</h2>
                  <p className="text-indigo-500 text-xs font-bold uppercase tracking-[0.6em] italic">V4.0 Operational Protocols</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <section className="bg-[#0e1014] border border-white/5 p-12 rounded-[4rem] shadow-2xl space-y-8">
                      <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Vision Shard Protocols</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Architect.io's multi-modal engine analyzes uploaded images to infer structural patterns and design logic. Uplink a UI screenshot or a logic diagram to provide aesthetic and functional context for the synthesis engine.</p>
                   </section>

                   <section className="bg-[#0e1014] border border-white/5 p-12 rounded-[4rem] shadow-2xl space-y-8">
                      <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Cross-Platform Matrix</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Every AI model has a specific "linguistic signature." Architect.io dynamically modifies the prompt structure based on your target model selection.</p>
                   </section>
                </div>
              </div>
            )}
            
            {activeTab === 'history' && (
              <div className="space-y-16 animate-fade-in">
                <header className="flex flex-col sm:flex-row items-end justify-between gap-10">
                  <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">The Vault.</h2>
                  <div className="relative w-full sm:w-[450px]">
                    <input type="text" placeholder="Search records..." className="w-full px-10 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm text-white outline-none focus:border-indigo-500 transition-all pl-16 shadow-2xl font-black uppercase italic tracking-widest" />
                    <svg className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {history.length === 0 && <p className="col-span-full text-center text-slate-600 uppercase font-black tracking-widest italic py-20">The Vault is currently empty.</p>}
                  {history.map(item => (
                    <div key={item.id} className="bg-[#0e1014] p-10 rounded-[3.5rem] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-2xl group" onClick={() => { setForm(item.input); setOutput(item.output); setActiveTab('build'); }}>
                      <div className="flex justify-between items-center mb-6">
                        <span className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">{item.input.target_AI}</span>
                        <span className="text-[9px] font-mono text-slate-700 uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">{item.input.high_level_goal}</h4>
                    </div>
                  ))}
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
                        <div className="flex justify-between py-3 border-b border-white/5 text-[10px] font-mono"><span className="text-slate-500 uppercase font-black">Status</span><span className={backendHealth === 'online' ? 'text-emerald-500' : 'text-rose-500'}>{backendHealth.toUpperCase()}</span></div>
                        <div className="flex justify-between py-3 border-b border-white/5 text-[10px] font-mono"><span className="text-slate-500 uppercase font-black">Credits</span><span className="text-white">{userStatus.creditsRemaining.toLocaleString()} REMAINING</span></div>
                        <div className="flex justify-between py-3 border-b border-white/5 text-[10px] font-mono"><span className="text-slate-500 uppercase font-black">Plan</span><span className="text-white italic">{userStatus.plan.toUpperCase()}</span></div>
                      </div>
                      <p className="text-[10px] text-slate-700 leading-relaxed font-bold uppercase tracking-widest italic">Render Uplink Operational. Verify secrets for Stripe synchronization.</p>
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
