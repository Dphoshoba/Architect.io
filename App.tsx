
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { PromptInput, PromptOutput, HistoryItem, MastermindSuggestionCategory, InterviewQuestion } from './types';
import { TextArea } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  generateVisualImage, 
  generateMastermindSuggestions,
  generateInterviewQuestions
} from './services/geminiService';

// --- Icons ---
const Icons = {
  Sparkles: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Globe: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  Cpu: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2-2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>,
  Home: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Palette: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
  Photo: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Video: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Mic: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 19v4m-4 0h8" /></svg>,
  ArrowLeft: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Copy: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
  Stop: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>,
  Upload: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>,
  Download: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Fullscreen: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>,
  ExitFullscreen: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h4V6m0 4l-5-5m16 5h-4V6m0 4l5-5M3 14h4v4m0-4l-5 5m16-5h-4v4m0-4l5 5" /></svg>,
  Github: (props: any) => <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
};

// --- Helpers ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

const GUIDED_FLOWS = {
  'Engineering': { title: 'ENGINEERING', icon: Icons.Cpu, desc: "Gadgets, custom tools, or clever systems.", questions: [{ key: 'eng_field', label: 'Domain' }, { key: 'high_level_goal', label: 'Goal' }] },
  'Real Estate': { title: 'REAL ESTATE', icon: Icons.Home, desc: "Dream homes or spatial layouts.", questions: [{ key: 'estate_style', label: 'Style' }, { key: 'high_level_goal', label: 'Goal' }] },
  'Artist': { title: 'ART & CREATIVE', icon: Icons.Palette, desc: "Express your soul through art concepts.", questions: [{ key: 'artist_medium', label: 'Medium' }, { key: 'high_level_goal', label: 'Concept' }] },
  'Image': { title: 'VISUAL ASSET', icon: Icons.Photo, desc: "Cinematic photos or graphic styles.", questions: [{ key: 'img_lighting', label: 'Vibe' }, { key: 'high_level_goal', label: 'Scene' }] },
  'Website': { title: 'WEB & SAAS', icon: Icons.Globe, desc: "Digital homes for communities or business.", questions: [{ key: 'web_type', label: 'Type' }, { key: 'web_aesthetic', label: 'Vibe' }, { key: 'high_level_goal', label: 'Goal' }] },
  'Live': { title: 'VOICE CHAT', icon: Icons.Mic, desc: "Simply talk to the architect.", questions: [] }
};

const SHARDS = {
  eng_field: [{ label: "Software", desc: "Apps" }, { label: "Machines", desc: "Hardware" }],
  estate_style: [{ label: "Modern", desc: "Clean" }, { label: "Cozy", desc: "Warm" }],
  artist_medium: [{ label: "Digital", desc: "Screen" }, { label: "Canvas", desc: "Physical" }],
  img_lighting: [{ label: "Cinematic", desc: "Drama" }, { label: "Natural", desc: "Bright" }],
  web_type: [{ label: "Non-Profit", desc: "Charity" }, { label: "SaaS", desc: "Business" }],
  web_aesthetic: [{ label: "Welcoming", desc: "Clean" }, { label: "Impactful", desc: "Bold" }]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY'>('BUILD');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guidedState, setGuidedState] = useState({ category: null as string | null, index: 0 });
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [githubSyncing, setGithubSyncing] = useState(false);

  // Live State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", high_level_goal: "", task_type: "Synthesis", domain_context: "",
    user_persona: "Architect", tone_style: "Professional", output_format: "Markdown",
    length_and_depth: "Detailed", reasoning_visibility: "detailed", language: "English",
    visual_inspiration_mode: true, isSimpleMode: true
  });

  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [mastermindSuggestions, setMastermindSuggestions] = useState<MastermindSuggestionCategory[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('arch_quantum_v1');
    if (saved) setHistory(JSON.parse(saved));
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleStartFlow = async () => {
    setLoading(true);
    try {
      const res = await generateInterviewQuestions({ ...form, isSimpleMode });
      setInterviewQuestions(res);
      setIsInterviewing(true);
    } catch { alert("API Error. Check keys."); } finally { setLoading(false); }
  };

  const handleAnalyzeMatrix = async () => {
    setLoading(true);
    try {
      const res = await generateMastermindSuggestions({ ...form, high_level_goal: `${form.high_level_goal} ${Object.values(interviewAnswers).join(' ')}`, isSimpleMode });
      setMastermindSuggestions(res);
      setIsReviewing(true);
      setIsInterviewing(false);
    } catch { alert("Matrix failed."); } finally { setLoading(false); }
  };

  const handleSynthesize = async () => {
    setLoading(true);
    try {
      const finalGoal = `OBJECTIVE: ${form.high_level_goal}\nREFINEMENTS: ${Object.values(selectedSuggestions).join(', ')}`;
      const res = await generateArchitectPrompt({ ...form, high_level_goal: finalGoal, isSimpleMode });
      setOutput(res);
      const img = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || finalGoal);
      setGeneratedVisual(img);
      const newItem = { id: Date.now().toString(), timestamp: Date.now(), input: { ...form, isSimpleMode }, output: res };
      const newHist = [newItem, ...history];
      setHistory(newHist);
      localStorage.setItem('arch_quantum_v1', JSON.stringify(newHist));
    } catch { alert("Synthesis failed."); } finally { setLoading(false); }
  };

  const stopLiveDiscovery = () => {
    if (sessionRef.current) sessionRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    setIsLiveActive(false);
    setGuidedState({ category: null, index: 0 });
    setMicLevel(0);
  };

  const startLiveDiscovery = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioContextInRef.current) audioContextInRef.current = new AudioContext({ sampleRate: 16000 });
      if (!audioContextOutRef.current) audioContextOutRef.current = new AudioContext({ sampleRate: 24000 });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => { setLoading(false); setIsLiveActive(true); },
          onmessage: async (m) => {
            const data = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (data) {
              const ctx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(data), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer; source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (m.serverContent?.outputTranscription) setLiveTranscription(p => [...p, m.serverContent!.outputTranscription!.text]);
          },
          onerror: stopLiveDiscovery, onclose: stopLiveDiscovery
        },
        config: { responseModalities: [Modality.AUDIO], outputAudioTranscription: {} }
      });
      sessionRef.current = await sessionPromise;
    } catch { setLoading(false); alert("Mic required."); }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden text-[#141414] font-sans">
      <header className="h-16 flex items-center justify-between px-8 glass-header fixed top-0 w-full z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setOutput(null); setIsReviewing(false); setIsInterviewing(false); setGuidedState({ category: null, index: 0 }); }}>
            <div className="w-8 h-8 bg-[#141414] rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
            <h1 className="text-xl font-black uppercase tracking-tighter">ARCHITECT<span className="text-[#0055FF]">.QUANTUM</span></h1>
          </div>
          <nav className="flex gap-6">
            <button onClick={() => setActiveTab('BUILD')} className={`text-[11px] font-bold uppercase tracking-widest ${activeTab === 'BUILD' ? 'text-black border-b-2 border-black' : 'text-slate-400'}`}>Synthesis</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`text-[11px] font-bold uppercase tracking-widest ${activeTab === 'HISTORY' ? 'text-black border-b-2 border-black' : 'text-slate-400'}`}>Archive</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={toggleFullscreen} className="p-2 rounded-full hover:bg-slate-100 transition-all text-slate-500 hover:text-black">
                {isFullscreen ? <Icons.ExitFullscreen className="w-5 h-5" /> : <Icons.Fullscreen className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsSimpleMode(!isSimpleMode)} className={`flex items-center gap-2 p-1.5 px-4 rounded-full border ${isSimpleMode ? 'bg-blue-50 border-blue-200 text-[#0055FF]' : 'bg-slate-100 border-transparent text-slate-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-tighter">Simple Mode</span>
                <div className={`w-3 h-3 rounded-full ${isSimpleMode ? 'bg-[#0055FF]' : 'bg-slate-300'}`} />
            </button>
            <button className="mobbin-btn-primary text-[10px] uppercase tracking-widest px-6 py-2.5">Get Enterprise</button>
        </div>
      </header>

      <div className="flex-1 mt-16 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/90 flex flex-col items-center justify-center backdrop-blur-md">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0055FF] rounded-full animate-spin mb-6" />
            <p className="font-black text-[12px] uppercase tracking-[0.3em] text-slate-400">Synthesizing Logic Shards...</p>
          </div>
        )}

        {/* VOICE DISCOVERY */}
        {isLiveActive && (
          <div className="h-full flex flex-col items-center justify-center p-12 bg-white animate-fade-in">
            <h2 className="text-5xl font-black uppercase italic mb-8">Listening...</h2>
            <div className="w-full max-w-2xl bg-slate-50 rounded-[3rem] p-12 h-64 border border-black/5 overflow-y-auto text-xl">{liveTranscription.join(' ')}</div>
            <button onClick={stopLiveDiscovery} className="mobbin-btn-primary px-16 py-6 mt-12 flex items-center gap-4 text-xs tracking-[0.3em]"><Icons.Stop className="w-6 h-6" /> END DISCOVERY</button>
          </div>
        )}

        {/* START SCREEN */}
        {activeTab === 'BUILD' && !guidedState.category && !output && !isLiveActive && (
          <div className="h-full flex flex-col items-center justify-center p-12 pt-24 overflow-y-auto custom-scrollbar">
            <h2 className="text-[7vw] mb-4 uppercase italic leading-none font-black tracking-tighter">New Blueprint.</h2>
            <p className="text-slate-400 font-medium text-xl mb-16">Select an industrial synthesis engine to begin.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl px-6">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button key={key} onClick={() => { setGuidedState({ category: key, index: 0 }); if(key === 'Live') startLiveDiscovery(); }} className="mobbin-card p-10 flex flex-col items-center text-center hover:border-[#0055FF] hover:bg-blue-50 transition-all min-h-[300px] justify-center">
                  <flow.icon className="w-16 h-16 text-[#0055FF] mb-6" />
                  <h3 className="text-sm font-black uppercase tracking-widest mb-3">{flow.title}</h3>
                  <p className="text-[12px] text-slate-500 italic max-w-[200px]">{flow.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GUIDED STEPS */}
        {guidedState.category && !isInterviewing && !isReviewing && !output && !isLiveActive && (
          <div className="h-full p-12 overflow-y-auto custom-scrollbar bg-white">
            <div className="max-w-5xl mx-auto space-y-16 py-12">
              <button onClick={() => setGuidedState({ category: null, index: 0 })} className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic hover:text-black flex items-center gap-2"><Icons.ArrowLeft className="w-4 h-4" /> Back</button>
              <h2 className="text-[8vw] uppercase font-black italic tracking-tighter leading-none">{GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.label}</h2>
              {GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.key === 'high_level_goal' ? (
                <TextArea autoFocus value={form.high_level_goal} onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} className="text-4xl py-14 min-h-[400px] rounded-[4rem] border-4 border-slate-100 shadow-xl" placeholder="Describe the goal..." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {(SHARDS as any)[GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.key]?.map((opt: any) => (
                    <button key={opt.label} onClick={() => { setForm(p => ({ ...p, [GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index].key]: opt.label })); if(guidedState.index < GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions.length - 1) setGuidedState(p => ({...p, index: p.index + 1})); else handleStartFlow(); }} className="mobbin-card p-12 text-left border-2 hover:border-[#0055FF] hover:bg-blue-50 transition-all">
                      <span className="text-xl font-black uppercase block mb-2">{opt.label}</span>
                      <p className="text-xs text-slate-400 uppercase">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              )}
              {GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.key === 'high_level_goal' && (
                <button onClick={handleStartFlow} className="mobbin-btn-primary w-full py-10 uppercase text-lg italic tracking-[0.5em]">Synthesize</button>
              )}
            </div>
          </div>
        )}

        {/* INTERVIEW */}
        {isInterviewing && (
           <div className="h-full p-16 overflow-y-auto bg-white custom-scrollbar">
              <div className="max-w-5xl mx-auto space-y-16 text-center py-12">
                 <h2 className="text-9xl font-black italic uppercase leading-none tracking-tighter">Probe.</h2>
                 <div className="space-y-12 text-left mt-20">
                  {interviewQuestions.map(q => (
                      <div key={q.id} className="mobbin-card p-12 space-y-8 border-2 border-slate-100">
                        <h4 className="text-3xl font-black italic">{q.question}</h4>
                        <div className="flex flex-wrap gap-4">
                          {q.options?.map(opt => (
                            <button key={opt} onClick={() => setInterviewAnswers(p => ({ ...p, [q.id]: opt }))} className={`px-8 py-4 rounded-2xl border-2 font-black uppercase text-xs tracking-widest ${interviewAnswers[q.id] === opt ? 'bg-black border-black text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500'}`}>{opt}</button>
                          ))}
                        </div>
                        <TextArea value={interviewAnswers[q.id] || ""} onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))} className="min-h-[120px] rounded-[2rem] border-slate-100" placeholder="Custom response..." />
                      </div>
                  ))}
                 </div>
                 <button onClick={handleAnalyzeMatrix} className="mobbin-btn-primary w-full py-12 uppercase tracking-[0.6em] text-lg font-black italic shadow-2xl">Refine Shards</button>
              </div>
           </div>
        )}

        {/* STRATEGY MATRIX */}
        {isReviewing && (
          <div className="h-full p-16 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-16 text-center py-12">
               <h2 className="text-[10vw] font-black italic uppercase leading-none tracking-tighter">Matrix.</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left mt-16">
                  {mastermindSuggestions.map((cat, i) => (
                    <div key={i} className="mobbin-card p-10 space-y-8 border-2 border-slate-100 shadow-xl">
                      <h4 className="text-[11px] font-black uppercase text-[#0055FF] tracking-[0.4em] italic border-b border-slate-100 pb-6">{cat.category}</h4>
                      <div className="space-y-4">
                         {cat.options.map((opt, j) => (
                           <button key={j} onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} className={`w-full p-8 rounded-[2rem] text-left border-2 transition-all ${selectedSuggestions[cat.category] === opt.technical_value ? 'bg-black border-black text-white scale-105' : 'bg-white border-slate-50 hover:border-blue-200'}`}>
                              <span className="text-sm font-black uppercase block mb-1">{opt.label}</span>
                              <p className="text-[10px] opacity-70 uppercase tracking-tighter">{opt.description}</p>
                           </button>
                         ))}
                      </div>
                    </div>
                  ))}
               </div>
               <button onClick={handleSynthesize} className="mobbin-btn-primary w-full py-14 text-2xl uppercase tracking-[1em] italic font-black">Generate Synthesis</button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {output && (
           <main className="absolute inset-0 z-[200] p-12 overflow-y-auto bg-white custom-scrollbar animate-fade-in">
               <div className="max-w-6xl mx-auto space-y-24 pb-48">
                   <div className="flex justify-between items-end border-b-4 border-slate-100 pb-12">
                      <div>
                        <h3 className="text-[10vw] font-black italic leading-none tracking-tighter">FINAL.</h3>
                        <p className="text-[#0055FF] font-black uppercase tracking-[0.5em] text-[12px] mt-6 italic">Architecture Verified via Knowledge Base v2.5</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => { setGithubSyncing(true); setTimeout(() => { setGithubSyncing(false); alert("Success!"); }, 2000); }} className="mobbin-btn-secondary uppercase text-[10px] tracking-widest font-black px-8 py-5 flex items-center gap-3 border-2 border-slate-200 hover:bg-slate-50"><Icons.Github className={`w-5 h-5 ${githubSyncing ? 'animate-bounce' : ''}`} /> {githubSyncing ? 'Syncing...' : 'Sync GitHub'}</button>
                        <button onClick={() => setOutput(null)} className="mobbin-btn-primary uppercase text-[10px] tracking-widest font-black px-8 py-5">New Start</button>
                      </div>
                   </div>

                   {/* APPLIED STRATEGIES MATRIX */}
                   <div className="space-y-10">
                       <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">Quantum Strategy Shards</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {output.APPLIED_STRATEGIES.map((strat, i) => (
                           <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-blue-300 transition-all">
                             <div className="text-[10px] font-black text-blue-500 mb-2 uppercase tracking-widest italic">Shard {i + 1}</div>
                             <div className="text-xl font-black uppercase mb-2 leading-none">{strat.name}</div>
                             <p className="text-[11px] text-slate-500 uppercase italic font-medium">{strat.description}</p>
                           </div>
                         ))}
                       </div>
                   </div>

                   <div className="space-y-8">
                      <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">01. {isSimpleMode ? 'Guide' : 'Architecture'}</h4>
                      <div className="mobbin-card p-16 text-3xl font-medium leading-relaxed bg-[#FDFDFD] border-2 border-slate-100 shadow-2xl whitespace-pre-wrap">{output.APP_BLUEPRINT}</div>
                   </div>

                   <div className="space-y-8">
                      <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">02. RODES Implementation</h4>
                      <div className="bg-[#141414] text-white/70 p-16 rounded-[4rem] font-mono text-lg leading-relaxed whitespace-pre-wrap shadow-2xl overflow-x-auto">{output.FINAL_PROMPT}</div>
                   </div>

                   {generatedVisual && (
                     <div className="space-y-8">
                        <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">03. Synthesis Render</h4>
                        <div className="p-4 bg-slate-50 rounded-[6rem] border-2 border-slate-100 shadow-sm"><img src={generatedVisual} className="w-full rounded-[5rem] shadow-2xl" alt="Synthesis" /></div>
                     </div>
                   )}

                   {/* GITHUB TERMINAL */}
                   <div className="bg-[#141414] text-green-400 p-12 rounded-[3rem] font-mono text-lg shadow-2xl border border-white/5 space-y-4">
                       <div className="flex gap-2 mb-4"><div className="w-3 h-3 bg-red-500 rounded-full"></div><div className="w-3 h-3 bg-yellow-500 rounded-full"></div><div className="w-3 h-3 bg-green-500 rounded-full"></div></div>
                       <div>$ git commit -m "{output.COMMIT_MESSAGE}"</div>
                       <div className="opacity-50">Pushing architectural shards to remote: origin...</div>
                       <div className="opacity-50">Verified integrity of RODES framework... Done</div>
                       <div className="text-white font-black mt-4">✓ Synthesis Branch Synchronized.</div>
                   </div>
               </div>
           </main>
        )}

        {/* ARCHIVE */}
        {activeTab === 'HISTORY' && (
           <div className="h-full p-20 overflow-y-auto bg-white custom-scrollbar">
             <div className="max-w-6xl mx-auto">
               <h2 className="text-[9vw] font-black italic uppercase leading-none mb-24 tracking-tighter">Vault.</h2>
               {history.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-64 opacity-10"><Icons.Sparkles className="w-48 h-48 mb-12" /><p className="text-4xl tracking-[1.5em] font-black uppercase italic">Empty Vault</p></div>
               ) : (
                 <div className="grid grid-cols-1 gap-10">
                   {history.map(item => (
                     <div key={item.id} className="mobbin-card p-16 flex justify-between items-center cursor-pointer group hover:bg-blue-50 transition-all border-2 border-slate-100" onClick={() => { setOutput(item.output); setActiveTab('BUILD'); }}>
                       <div className="space-y-4">
                          <span className="text-[#0055FF] font-black uppercase text-[11px] tracking-[0.4em] italic">{new Date(item.timestamp).toLocaleDateString()}</span>
                          <h4 className="text-6xl font-black italic group-hover:text-[#0055FF] leading-tight uppercase tracking-tighter">{item.input.high_level_goal?.substring(0, 40)}...</h4>
                       </div>
                       <Icons.Sparkles className="w-16 h-16 text-slate-100 group-hover:text-[#0055FF] transition-all" />
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default App;
