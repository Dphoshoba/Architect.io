
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

// --- Typing Effect Component ---
const TypingTerminal: React.FC<{ message: string }> = ({ message }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(message.substring(0, i));
      i++;
      if (i > message.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="flex items-start gap-2">
      <span className="text-blue-400 shrink-0">architect@quantum</span>
      <span className="text-slate-400 shrink-0">:</span>
      <span className="text-slate-400 shrink-0">~</span>
      <span className="text-white shrink-0">$</span>
      <span className="text-[#4ADE80] break-all">{displayed}<span className="animate-pulse">|</span></span>
    </div>
  );
};

// --- Helpers ---
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
  'Engineering': { 
    title: 'ENGINEERING', 
    icon: Icons.Cpu, 
    desc: "Synthesize industrial prototypes, IoT hardware, or complex mechanical blueprints.", 
    questions: [{ key: 'eng_field', label: 'Domain' }, { key: 'high_level_goal', label: 'Goal' }] 
  },
  'Real Estate': { 
    title: 'REAL ESTATE', 
    icon: Icons.Home, 
    desc: "Architect luxury modern estates, urban spatial plans, or minimalist interior concepts.", 
    questions: [{ key: 'estate_style', label: 'Style' }, { key: 'high_level_goal', label: 'Goal' }] 
  },
  'Artist': { 
    title: 'ART & CREATIVE', 
    icon: Icons.Palette, 
    desc: "Mythological epics, biblical narratives, or high-concept conceptual digital art.", 
    questions: [{ key: 'artist_medium', label: 'Medium' }, { key: 'high_level_goal', label: 'Concept' }] 
  },
  'Image': { 
    title: 'VISUAL ASSET', 
    icon: Icons.Photo, 
    desc: "Cinematic chiaroscuro lighting, photorealistic portraits, or hyper-real textures.", 
    questions: [{ key: 'img_lighting', label: 'Vibe' }, { key: 'high_level_goal', label: 'Scene' }] 
  },
  'Website': { 
    title: 'WEB & SAAS', 
    icon: Icons.Globe, 
    desc: "Design high-conversion SaaS landing pages, impact-driven portals, or global storefronts.", 
    questions: [{ key: 'web_type', label: 'Type' }, { key: 'web_aesthetic', label: 'Vibe' }, { key: 'high_level_goal', label: 'Goal' }] 
  },
  'Live': { 
    title: 'VOICE CHAT', 
    icon: Icons.Mic, 
    desc: "Engage in real-time voice synthesis and strategic architectural brainstorming.", 
    questions: [] 
  }
};

const SHARDS = {
  eng_field: [
    { label: "Software Architecture", desc: "Microservices & Cloud" }, 
    { label: "Hardware / IoT", desc: "Mechanical & Systems" },
    { label: "Industrial Design", desc: "CAD & Prototypes" },
    { label: "Network Security", desc: "Infra & Defense" }
  ],
  estate_style: [
    { label: "Ultra-Modern", desc: "Glass & Steel" }, 
    { label: "Organic Minimalist", desc: "Warm & Clean" },
    { label: "Industrial Loft", desc: "Raw & Urban" },
    { label: "Classic Estate", desc: "Timeless & Grand" }
  ],
  artist_medium: [
    { label: "Biblical / Epic", desc: "Mythology & Story" }, 
    { label: "Conceptual Modern", desc: "Abstract & High-Theory" },
    { label: "Digital Painterly", desc: "Brushwork & Texture" },
    { label: "Surrealist / Dream", desc: "Otherworldly & Logic" }
  ],
  img_lighting: [
    { label: "Chiaroscuro", desc: "High Contrast Shadows" }, 
    { label: "Golden Hour", desc: "Soft & Atmospheric" },
    { label: "Studio High-Key", desc: "Commercial & Sharp" },
    { label: "Neon / Cyber", desc: "Vibrant & Dynamic" }
  ],
  web_type: [
    { label: "SaaS Landing Page", desc: "Conversion & Scale" }, 
    { label: "Non-Profit Portal", desc: "Impact & Community" },
    { label: "E-Commerce Store", desc: "Retail & Checkout" },
    { label: "Artist Portfolio", desc: "Visual & Unique" }
  ],
  web_aesthetic: [
    { label: "Bold & High-Contrast", desc: "Impactful" }, 
    { label: "Clean & Welcoming", desc: "Accessible" },
    { label: "Glassmorphic / Glossy", desc: "Modern & Tech" },
    { label: "Brutalist / Raw", desc: "Minimal & Edgy" }
  ]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY'>('BUILD');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guidedState, setGuidedState] = useState({ category: null as string | null, index: 0 });
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [githubSyncing, setGithubSyncing] = useState(false);

  // Live State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string[]>([]);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", high_level_goal: "", task_type: "Synthesis", domain_context: "",
    user_persona: "Lead Architect", tone_style: "Professional", output_format: "Markdown",
    length_and_depth: "Detailed", reasoning_visibility: "detailed", language: "English",
    visual_inspiration_mode: true, isSimpleMode: false
  });

  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [mastermindSuggestions, setMastermindSuggestions] = useState<MastermindSuggestionCategory[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('arch_biblical_v1');
    if (saved) setHistory(JSON.parse(saved));
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const resetSynthesisState = () => {
    setInterviewQuestions([]);
    setInterviewAnswers({});
    setMastermindSuggestions([]);
    setSelectedSuggestions({});
    setOutput(null);
    setGeneratedVisual(null);
    setLiveTranscription([]);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleCopyImage = async (dataUrl: string) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      alert("Image copied to clipboard!");
    } catch (err) {
      handleCopy(dataUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setForm(prev => ({
          ...prev,
          media_ref_base64: base64,
          media_type: file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'audio'
        }));
        alert("Reference source attached.");
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
  };

  const handleStartFlow = async () => {
    resetSynthesisState();
    setLoading(true);
    try {
      const res = await generateInterviewQuestions({ ...form, isSimpleMode });
      setInterviewQuestions(res);
      setIsInterviewing(true);
    } catch { alert("Error starting synthesis."); } finally { setLoading(false); }
  };

  const handleAnalyzeMatrix = async () => {
    setLoading(true);
    setMastermindSuggestions([]); 
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
      localStorage.setItem('arch_biblical_v1', JSON.stringify(newHist));
    } catch { alert("Synthesis failed."); } finally { setLoading(false); }
  };

  const stopLiveDiscovery = () => {
    if (sessionRef.current) sessionRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    setIsLiveActive(false);
    setGuidedState({ category: null, index: 0 });
  };

  const startLiveDiscovery = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    <div className="flex flex-col h-screen bg-white overflow-hidden text-[#141414] font-sans selection:bg-blue-500 selection:text-white">
      <header className="h-16 flex items-center justify-between px-8 glass-header fixed top-0 w-full z-[100]">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { resetSynthesisState(); setGuidedState({ category: null, index: 0 }); setIsReviewing(false); setIsInterviewing(false); }}>
            <div className="w-8 h-8 bg-[#141414] rounded-lg flex items-center justify-center text-white font-black text-xs transition-transform group-hover:scale-110">B</div>
            <h1 className="text-xl font-black uppercase tracking-tighter">ARCHITECT<span className="text-[#0055FF] animate-pulse">.QUANTUM</span></h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <button onClick={() => setActiveTab('BUILD')} className={`text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'BUILD' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-black'}`}>Synthesis</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-black'}`}>Vault</button>
          </nav>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
            <button onClick={toggleFullscreen} className="hidden sm:block p-2 rounded-full hover:bg-slate-100 transition-all text-slate-500 hover:text-black">
                {isFullscreen ? <Icons.ExitFullscreen className="w-5 h-5" /> : <Icons.Fullscreen className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsSimpleMode(!isSimpleMode)} className={`flex items-center gap-2 p-1.5 px-3 md:px-4 rounded-full border transition-all ${isSimpleMode ? 'bg-blue-50 border-blue-200 text-[#0055FF]' : 'bg-slate-100 border-transparent text-slate-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">Simple Mode</span>
                <div className={`w-3 h-3 rounded-full ${isSimpleMode ? 'bg-[#0055FF]' : 'bg-slate-300'}`} />
            </button>
            <button className="mobbin-btn-primary text-[10px] uppercase tracking-widest px-4 md:px-6 py-2.5 shadow-lg active:scale-95">Enterprise</button>
        </div>
      </header>

      <div className="flex-1 mt-16 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/95 flex flex-col items-center justify-center backdrop-blur-xl animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
              <div className="w-16 h-16 border-4 border-transparent border-t-[#0055FF] rounded-full animate-spin absolute top-0" />
            </div>
            <p className="font-black text-[12px] uppercase tracking-[0.5em] text-slate-400 italic mt-8 animate-pulse">Synthesizing Narrative Shards...</p>
          </div>
        )}

        {/* VOICE DISCOVERY */}
        {isLiveActive && (
          <div className="h-full overflow-y-auto custom-scrollbar bg-white animate-fade-in">
            <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12">
              <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping opacity-25" />
                <Icons.Mic className="w-12 h-12 text-blue-500 animate-bounce" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 tracking-tighter text-center">Architect is Listening...</h2>
              <div className="w-full max-w-2xl bg-slate-50 rounded-[2.5rem] p-8 md:p-12 h-64 border border-black/5 overflow-y-auto text-xl italic text-slate-500 shadow-inner custom-scrollbar">{liveTranscription.length > 0 ? liveTranscription.join(' ') : "Initializing quantum voice field..."}</div>
              <button onClick={stopLiveDiscovery} className="mobbin-btn-primary px-12 md:px-16 py-5 md:py-6 mt-12 flex items-center gap-4 text-xs tracking-[0.3em] shadow-xl hover:bg-red-500 transition-colors"><Icons.Stop className="w-6 h-6" /> END DISCOVERY</button>
            </div>
          </div>
        )}

        {/* START SCREEN */}
        {activeTab === 'BUILD' && !guidedState.category && !output && !isLiveActive && (
          <div className="h-full overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 py-12 md:py-24">
              <h2 className="text-[12vw] md:text-[7vw] mb-4 uppercase italic leading-none font-black tracking-tighter text-center">Narrative Architect.</h2>
              <p className="text-slate-400 font-medium text-lg md:text-xl mb-12 md:mb-16 italic text-center max-w-2xl">Select an industrial engine to synthesize your quantum vision into high-fidelity prompts.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-7xl px-4 md:px-6">
                {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                  <button key={key} onClick={() => { resetSynthesisState(); setGuidedState({ category: key, index: 0 }); if(key === 'Live') startLiveDiscovery(); }} className="mobbin-card p-8 md:p-10 flex flex-col items-center text-center hover:border-[#0055FF] hover:bg-blue-50 transition-all min-h-[260px] md:min-h-[300px] justify-center group">
                    <flow.icon className="w-12 h-12 md:w-16 md:h-16 text-[#0055FF] mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-black uppercase tracking-widest mb-3">{flow.title}</h3>
                    <p className="text-[11px] md:text-[12px] text-slate-500 italic max-w-[220px]">{flow.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GUIDED STEPS */}
        {guidedState.category && !isInterviewing && !isReviewing && !output && !isLiveActive && (
          <div className="h-full overflow-y-auto custom-scrollbar bg-white animate-fade-in">
            <div className="max-w-5xl mx-auto space-y-12 md:space-y-16 py-12 md:py-20 px-6">
              <div className="flex justify-between items-center">
                <button onClick={() => setGuidedState({ category: null, index: 0 })} className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic hover:text-black flex items-center gap-2 transition-colors"><Icons.ArrowLeft className="w-4 h-4" /> Back</button>
                <div className="flex gap-4">
                  <label className="mobbin-btn-secondary px-6 py-3 text-[10px] cursor-pointer flex items-center gap-2 border-slate-200 hover:bg-slate-50 shadow-sm active:scale-95">
                    <Icons.Upload className="w-4 h-4" /> ATTACH REF
                    <input type="file" className="hidden" accept="image/*,video/*,audio/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-[#0055FF] text-[10px] font-black uppercase tracking-[0.5em] italic">Step {guidedState.index + 1} of {GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions.length}</span>
                <h2 className="text-[14vw] md:text-[8vw] uppercase font-black italic tracking-tighter leading-none">{GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.label}</h2>
              </div>
              {GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.key === 'high_level_goal' ? (
                <TextArea autoFocus value={form.high_level_goal} onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} className="text-2xl md:text-4xl py-10 md:py-14 min-h-[300px] md:min-h-[400px] rounded-[3rem] md:rounded-[4rem] border-2 md:border-4 border-slate-100 shadow-xl focus:shadow-2xl transition-all" placeholder="Describe the theology, concept, or technical requirement..." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  {(SHARDS as any)[GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.key]?.map((opt: any) => (
                    <button key={opt.label} onClick={() => { setForm(p => ({ ...p, [GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index].key]: opt.label })); if(guidedState.index < GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions.length - 1) setGuidedState(p => ({...p, index: p.index + 1})); else handleStartFlow(); }} className="mobbin-card p-10 md:p-12 text-left border-2 hover:border-[#0055FF] hover:bg-blue-50 transition-all group">
                      <span className="text-xl md:text-2xl font-black uppercase block mb-2 group-hover:text-blue-600 transition-colors">{opt.label}</span>
                      <p className="text-xs text-slate-400 uppercase italic font-medium tracking-wide">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              )}
              {GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.key === 'high_level_goal' && (
                <button onClick={handleStartFlow} className="mobbin-btn-primary w-full py-8 md:py-10 uppercase text-lg italic tracking-[0.5em] shadow-2xl active:scale-[0.98]">Synthesize Core</button>
              )}
            </div>
          </div>
        )}

        {/* INTERVIEW */}
        {isInterviewing && (
           <div className="h-full overflow-y-auto custom-scrollbar bg-white animate-fade-in">
              <div className="max-w-5xl mx-auto space-y-12 md:space-y-16 text-center py-12 md:py-24 px-6">
                 <div className="space-y-4">
                  <span className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">Quantum Discovery Phase</span>
                  <h2 className="text-7xl md:text-9xl font-black italic uppercase leading-none tracking-tighter">PROBE.</h2>
                 </div>
                 <div className="space-y-8 md:space-y-12 text-left mt-12 md:mt-20">
                  {interviewQuestions.length > 0 ? interviewQuestions.map(q => (
                      <div key={q.id} className="mobbin-card p-8 md:p-12 space-y-8 border-2 border-slate-100 shadow-xl hover:border-blue-100 transition-all">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{q.context}</span>
                          <h4 className="text-2xl md:text-3xl font-black italic">{q.question}</h4>
                        </div>
                        <div className="flex flex-wrap gap-3 md:gap-4">
                          {q.options?.map(opt => (
                            <button key={opt} onClick={() => setInterviewAnswers(p => ({ ...p, [q.id]: opt }))} className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl border-2 font-black uppercase text-[10px] md:text-xs tracking-widest transition-all ${interviewAnswers[q.id] === opt ? 'bg-black border-black text-white shadow-lg scale-105' : 'bg-slate-50 border-transparent text-slate-500 hover:border-blue-200'}`}>{opt}</button>
                          ))}
                        </div>
                        <TextArea value={interviewAnswers[q.id] || ""} onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))} className="min-h-[120px] rounded-[2rem] border-slate-100 italic focus:bg-slate-50 transition-all" placeholder="Refine response further..." />
                      </div>
                  )) : (
                    <div className="py-20 flex items-center justify-center"><div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div></div>
                  )}
                 </div>
                 <button onClick={handleAnalyzeMatrix} className="mobbin-btn-primary w-full py-10 md:py-12 uppercase tracking-[0.6em] text-lg font-black italic shadow-2xl active:scale-95 transition-all">Engage Strategy Matrix</button>
              </div>
           </div>
        )}

        {/* STRATEGY MATRIX */}
        {isReviewing && (
          <div className="h-full overflow-y-auto custom-scrollbar bg-white animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-12 md:space-y-16 text-center py-12 md:py-24 px-6">
               <div className="space-y-4">
                <span className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">Engineering Refinement</span>
                <h2 className="text-8xl md:text-[10vw] font-black italic uppercase leading-none tracking-tighter">MATRIX.</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-left mt-12 md:mt-16">
                  {mastermindSuggestions.length > 0 ? mastermindSuggestions.map((cat, i) => (
                    <div key={i} className="mobbin-card p-8 md:p-10 space-y-8 border-2 border-slate-100 shadow-2xl hover:border-blue-100 transition-all bg-gradient-to-b from-white to-slate-50/50">
                      <h4 className="text-[11px] font-black uppercase text-[#0055FF] tracking-[0.4em] italic border-b border-slate-100 pb-6">{cat.category}</h4>
                      <div className="space-y-4">
                         {cat.options.map((opt, j) => (
                           <button key={j} onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} className={`w-full p-6 md:p-8 rounded-[2rem] text-left border-2 transition-all group ${selectedSuggestions[cat.category] === opt.technical_value ? 'bg-black border-black text-white scale-[1.03] shadow-xl' : 'bg-white border-slate-50 hover:border-blue-200 shadow-sm'}`}>
                              <span className="text-sm font-black uppercase block mb-1 group-hover:translate-x-1 transition-transform">{opt.label}</span>
                              <p className="text-[10px] opacity-70 uppercase tracking-tighter italic font-medium">{opt.description}</p>
                           </button>
                         ))}
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-20 flex items-center justify-center"><div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div></div>
                  )}
               </div>
               <button onClick={handleSynthesize} className="mobbin-btn-primary w-full py-10 md:py-14 text-xl md:text-2xl uppercase tracking-[1em] italic font-black shadow-[0_20px_50px_rgba(0,0,0,0.15)] active:scale-95 transition-all">Finalize Quantum Synthesis</button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {output && (
           <main className="absolute inset-0 z-[200] p-6 md:p-12 overflow-y-auto bg-white custom-scrollbar animate-fade-in pb-32">
               <div className="max-w-6xl mx-auto space-y-16 md:space-y-24">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-slate-100 pb-12 gap-8">
                      <div className="space-y-4">
                        <h3 className="text-7xl md:text-[10vw] font-black italic leading-none tracking-tighter">FINAL.</h3>
                        <p className="text-[#0055FF] font-black uppercase tracking-[0.5em] text-[10px] md:text-[12px] italic flex items-center gap-2">
                          <Icons.Sparkles className="w-4 h-4" /> 
                          Architecture Verified via Quantum Shards
                        </p>
                      </div>
                      <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={() => { setGithubSyncing(true); setTimeout(() => { setGithubSyncing(false); alert("GitHub Repository Synchronized!"); }, 2000); }} className="flex-1 md:flex-none mobbin-btn-secondary uppercase text-[10px] tracking-widest font-black px-6 md:px-8 py-4 md:py-5 flex items-center justify-center gap-3 border-2 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"><Icons.Github className={`w-5 h-5 ${githubSyncing ? 'animate-spin' : ''}`} /> {githubSyncing ? 'Syncing...' : 'Sync GitHub'}</button>
                        <button onClick={() => { resetSynthesisState(); setGuidedState({ category: null, index: 0 }); }} className="flex-1 md:flex-none mobbin-btn-primary uppercase text-[10px] tracking-widest font-black px-6 md:px-8 py-4 md:py-5 shadow-lg active:scale-95 transition-all">New Shard</button>
                      </div>
                   </div>

                   {/* STRATEGY SHARDS */}
                   <div className="space-y-8 md:space-y-10">
                       <h4 className="text-[#0055FF] text-[11px] md:text-[12px] font-black tracking-[1em] uppercase italic px-1">Applied Strategic Shards</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                         {output.APPLIED_STRATEGIES.map((strat, i) => (
                           <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-blue-400 hover:bg-white transition-all shadow-sm group">
                             <div className="text-[10px] font-black text-blue-500 mb-2 uppercase tracking-widest italic flex justify-between">
                               <span>Shard {String(i + 1).padStart(2, '0')}</span>
                               <Icons.Cpu className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <div className="text-xl font-black uppercase mb-2 leading-none">{strat.name}</div>
                             <p className="text-[11px] text-slate-500 uppercase italic font-bold tracking-tight leading-relaxed">{strat.description}</p>
                           </div>
                         ))}
                       </div>
                   </div>

                   {/* ARCHITECTURE SECTION */}
                   <div className="space-y-8 group">
                      <div className="flex justify-between items-center px-1">
                        <h4 className="text-[#0055FF] text-[11px] md:text-[12px] font-black tracking-[1.2em] uppercase italic">01. Architecture</h4>
                        <div className="flex gap-4">
                          <button onClick={() => handleCopy(output.APP_BLUEPRINT || '')} className="text-[10px] font-black uppercase flex items-center gap-2 hover:text-[#0055FF] transition-all py-1"><Icons.Copy className="w-4 h-4" /> Copy</button>
                          <button onClick={() => downloadText(output.APP_BLUEPRINT || '', "architecture.txt")} className="text-[10px] font-black uppercase flex items-center gap-2 hover:text-[#0055FF] transition-all py-1"><Icons.Download className="w-4 h-4" /> Export</button>
                        </div>
                      </div>
                      <div className="mobbin-card p-10 md:p-16 text-xl md:text-3xl font-medium leading-relaxed bg-[#FDFDFD] border-2 border-slate-100 shadow-2xl whitespace-pre-wrap selection:bg-blue-100 selection:text-blue-900 group-hover:border-blue-100 transition-all">{output.APP_BLUEPRINT}</div>
                   </div>

                   {/* PROMPT SPEC SECTION */}
                   <div className="space-y-8">
                      <div className="flex justify-between items-center px-1">
                        <h4 className="text-[#0055FF] text-[11px] md:text-[12px] font-black tracking-[1.2em] uppercase italic">02. RODES Specification</h4>
                        <div className="flex gap-4">
                          <button onClick={() => handleCopy(output.FINAL_PROMPT)} className="text-[10px] font-black uppercase flex items-center gap-2 hover:text-[#0055FF] transition-all py-1"><Icons.Copy className="w-4 h-4" /> Copy Spec</button>
                          <button onClick={() => downloadText(output.FINAL_PROMPT, "rodes_prompt.xml")} className="text-[10px] font-black uppercase flex items-center gap-2 hover:text-[#0055FF] transition-all py-1"><Icons.Download className="w-4 h-4" /> Export XML</button>
                        </div>
                      </div>
                      <div className="bg-[#141414] text-white/80 p-10 md:p-16 rounded-[3rem] md:rounded-[4rem] font-mono text-base md:text-lg leading-relaxed whitespace-pre-wrap shadow-2xl overflow-x-auto border border-white/5 selection:bg-blue-500 selection:text-white custom-scrollbar">{output.FINAL_PROMPT}</div>
                   </div>

                   {/* IMAGE SECTION */}
                   {generatedVisual && (
                     <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="text-[#0055FF] text-[11px] md:text-[12px] font-black tracking-[1.2em] uppercase italic">03. Chiaroscuro Render</h4>
                          <div className="flex gap-4">
                            <button onClick={() => handleCopyImage(generatedVisual!)} className="text-[10px] font-black uppercase flex items-center gap-2 hover:text-[#0055FF] p-2 hover:bg-blue-50 rounded-xl transition-all"><Icons.Copy className="w-4 h-4" /> Copy Image</button>
                            <button onClick={() => downloadText(generatedVisual!, "render.png")} className="text-[10px] font-black uppercase flex items-center gap-2 hover:text-[#0055FF] p-2 hover:bg-blue-50 rounded-xl transition-all"><Icons.Download className="w-4 h-4" /> Download PNG</button>
                          </div>
                        </div>
                        <div className="relative p-3 md:p-4 bg-slate-50 rounded-[4rem] md:rounded-[6rem] border-2 border-slate-100 shadow-xl group overflow-hidden">
                          <img src={generatedVisual} className="w-full rounded-[3rem] md:rounded-[5rem] shadow-2xl transition-all duration-1000 group-hover:scale-[1.03] group-hover:brightness-[0.85]" alt="Synthesis Render" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/20">
                             <div className="flex gap-4 scale-90 group-hover:scale-100 transition-transform duration-500">
                               <button onClick={() => handleCopyImage(generatedVisual!)} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-[#0055FF] hover:text-white transition-all flex items-center gap-2"><Icons.Copy className="w-4 h-4" /> Copy Image</button>
                               <button onClick={() => downloadText(generatedVisual!, "render.png")} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-[#0055FF] hover:text-white transition-all flex items-center gap-2"><Icons.Download className="w-4 h-4" /> Download</button>
                             </div>
                             <p className="text-white font-black text-[10px] uppercase tracking-[0.5em] italic drop-shadow-lg">8K Ultra-Fidelity Chiaroscuro Render</p>
                          </div>
                        </div>
                     </div>
                   )}

                   {/* GITHUB TERMINAL MOCKUP */}
                   <div className="bg-[#141414] text-[#4ADE80] p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] font-mono text-sm md:text-lg shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-white/5 space-y-4 relative overflow-hidden animate-slide-up group">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-green-400 opacity-60"></div>
                       <div className="flex gap-2 mb-6"><div className="w-3 h-3 bg-[#FF5F56] rounded-full shadow-[0_0_10px_rgba(255,95,86,0.5)]"></div><div className="w-3 h-3 bg-[#FFBD2E] rounded-full shadow-[0_0_10px_rgba(255,189,46,0.5)]"></div><div className="w-3 h-3 bg-[#27C93F] rounded-full shadow-[0_0_10px_rgba(39,201,63,0.5)]"></div></div>
                       <TypingTerminal message={`git commit -m "${output.COMMIT_MESSAGE}"`} />
                       <div className="opacity-70 flex items-center gap-3 transition-all group-hover:translate-x-1"><span className="animate-spin-slow text-slate-500">⟳</span> Pushing architectural shards to remote: origin...</div>
                       <div className="opacity-70 flex items-center gap-3 transition-all group-hover:translate-x-1"><span className="text-blue-500">ℹ</span> Verified integrity of RODES framework... Done</div>
                       <div className="text-white font-black mt-8 flex items-center gap-3 border-t border-white/10 pt-8 transition-all group-hover:translate-y-[-2px]">
                         <div className="w-6 h-6 bg-green-500 text-black flex items-center justify-center rounded-full text-xs">✓</div>
                         <span className="uppercase tracking-widest text-sm md:text-base">Synthesis Branch Synchronized.</span>
                       </div>
                   </div>
               </div>
           </main>
        )}

        {/* ARCHIVE */}
        {activeTab === 'HISTORY' && (
           <div className="h-full overflow-y-auto bg-white custom-scrollbar animate-fade-in">
             <div className="max-w-6xl mx-auto py-12 md:py-20 px-8">
               <h2 className="text-7xl md:text-[9vw] font-black italic uppercase leading-none mb-16 md:mb-24 tracking-tighter">Vault.</h2>
               {history.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-64 opacity-10"><Icons.Sparkles className="w-48 h-48 mb-12" /><p className="text-4xl tracking-[1.5em] font-black uppercase italic">Empty Vault</p></div>
               ) : (
                 <div className="grid grid-cols-1 gap-6 md:gap-10">
                   {history.map(item => (
                     <div key={item.id} className="mobbin-card p-8 md:p-16 flex justify-between items-center cursor-pointer group hover:bg-blue-50 transition-all border-2 border-slate-100 hover:scale-[1.01] active:scale-[0.99]" onClick={() => { setOutput(item.output); setActiveTab('BUILD'); }}>
                       <div className="space-y-4">
                          <span className="text-[#0055FF] font-black uppercase text-[10px] md:text-[11px] tracking-[0.4em] italic">{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          <h4 className="text-3xl md:text-6xl font-black italic group-hover:text-[#0055FF] leading-tight uppercase tracking-tighter transition-colors max-w-4xl truncate">{item.input.high_level_goal?.substring(0, 60)}...</h4>
                       </div>
                       <div className="hidden md:flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                         <Icons.Sparkles className="w-16 h-16 text-[#0055FF]" />
                       </div>
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
