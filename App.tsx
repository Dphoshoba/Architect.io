
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
  Stop: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>,
  Mic: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 19v4m-4 0h8" /></svg>,
  ArrowLeft: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Copy: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
  Download: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
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
    desc: "Mythological epics, conceptual digital art, or unique narrative visions.", 
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
    { label: "Digital Illustration", desc: "2D Narrative Art" }, 
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
    const saved = localStorage.getItem('arch_quantum_v1');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const resetSynthesisState = () => {
    setInterviewQuestions([]);
    setInterviewAnswers({});
    setMastermindSuggestions([]);
    setSelectedSuggestions({});
    setOutput(null);
    setGeneratedVisual(null);
    setLiveTranscription([]);
  };

  const handleStartFlow = async () => {
    resetSynthesisState();
    setLoading(true);
    try {
      const res = await generateInterviewQuestions({ ...form, isSimpleMode });
      setInterviewQuestions(res);
      setIsInterviewing(true);
    } catch (e) { 
      console.error(e);
      alert("Error starting synthesis. Please check your network connection."); 
    } finally { setLoading(false); }
  };

  const handleAnalyzeMatrix = async () => {
    setLoading(true);
    setMastermindSuggestions([]); 
    try {
      const res = await generateMastermindSuggestions({ ...form, high_level_goal: `${form.high_level_goal} ${Object.values(interviewAnswers).join(' ')}`, isSimpleMode });
      setMastermindSuggestions(res);
      setIsReviewing(true);
      setIsInterviewing(false);
    } catch (e) {
      console.error(e);
      alert("Strategy Matrix synthesis failed.");
    } finally { setLoading(false); }
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
    } catch (e) {
      console.error(e);
      alert("Final synthesis failed.");
    } finally { setLoading(false); }
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
    } catch (e) { 
      setLoading(false); 
      console.error(e);
      alert("Unable to start voice session. Please ensure microphone access is granted."); 
    }
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
        <div className="flex items-center gap-4">
            <button onClick={() => setIsSimpleMode(!isSimpleMode)} className={`flex items-center gap-2 p-1.5 px-4 rounded-full border transition-all ${isSimpleMode ? 'bg-blue-50 border-blue-200 text-[#0055FF]' : 'bg-slate-100 border-transparent text-slate-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">Simple Mode</span>
                <div className={`w-3 h-3 rounded-full ${isSimpleMode ? 'bg-[#0055FF]' : 'bg-slate-300'}`} />
            </button>
            <button className="mobbin-btn-primary text-[10px] uppercase tracking-widest px-6 py-2.5 shadow-lg active:scale-95">Enterprise</button>
        </div>
      </header>

      <div className="flex-1 mt-16 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/95 flex flex-col items-center justify-center backdrop-blur-xl animate-fade-in">
            <div className="w-16 h-16 border-4 border-transparent border-t-[#0055FF] rounded-full animate-spin mb-4" />
            <p className="font-black text-[12px] uppercase tracking-[0.5em] text-slate-400 italic">Synthesizing...</p>
          </div>
        )}

        {/* VOICE DISCOVERY */}
        {isLiveActive && (
          <div className="h-full overflow-y-auto custom-scrollbar bg-white animate-fade-in flex flex-col items-center justify-center p-12">
              <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping opacity-25" />
                <Icons.Mic className="w-12 h-12 text-blue-500 animate-bounce" />
              </div>
              <h2 className="text-5xl font-black uppercase italic mb-8 tracking-tighter text-center">Listening...</h2>
              <div className="w-full max-w-2xl bg-slate-50 rounded-3xl p-12 min-h-64 border border-black/5 overflow-y-auto text-xl italic text-slate-500 shadow-inner custom-scrollbar">
                {liveTranscription.length > 0 ? liveTranscription.join(' ') : "Initializing voice engine..."}
              </div>
              <button onClick={stopLiveDiscovery} className="mobbin-btn-primary px-16 py-6 mt-12 flex items-center gap-4 text-xs tracking-[0.3em] shadow-xl hover:bg-red-500 transition-colors">
                <Icons.Stop className="w-6 h-6" /> END DISCOVERY
              </button>
          </div>
        )}

        {/* START SCREEN */}
        {activeTab === 'BUILD' && !guidedState.category && !output && !isLiveActive && (
          <div className="h-full overflow-y-auto custom-scrollbar animate-fade-in flex flex-col items-center justify-center p-12 py-24">
              <h2 className="text-[8vw] mb-4 uppercase italic leading-none font-black tracking-tighter text-center">Synthesis Engine.</h2>
              <p className="text-slate-400 font-medium text-xl mb-16 italic text-center max-w-2xl">Refine your vision into high-fidelity prompt architecture.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl px-6">
                {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                  <button key={key} onClick={() => { setGuidedState({ category: key, index: 0 }); if(key === 'Live') startLiveDiscovery(); }} className="mobbin-card p-10 flex flex-col items-center text-center hover:border-[#0055FF] hover:bg-blue-50 transition-all min-h-[300px] justify-center group">
                    <flow.icon className="w-16 h-16 text-[#0055FF] mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-black uppercase tracking-widest mb-3">{flow.title}</h3>
                    <p className="text-[12px] text-slate-500 italic max-w-[220px]">{flow.desc}</p>
                  </button>
                ))}
              </div>
          </div>
        )}

        {/* INTERVIEW UI (Discovery Phase) */}
        {isInterviewing && !isReviewing && !output && (
           <div className="h-full overflow-y-auto custom-scrollbar bg-white animate-fade-in p-12">
              <div className="max-w-4xl mx-auto space-y-12">
                 <h2 className="text-7xl font-black italic uppercase leading-none tracking-tighter text-center">DISCOVERY.</h2>
                 <div className="space-y-8">
                  {interviewQuestions.map(q => (
                      <div key={q.id} className="mobbin-card p-12 space-y-6">
                        <div>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{q.context}</span>
                          <h4 className="text-3xl font-black italic">{q.question}</h4>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {q.options?.map(opt => (
                            <button key={opt} onClick={() => setInterviewAnswers(p => ({ ...p, [q.id]: opt }))} className={`px-8 py-4 rounded-2xl border-2 font-black uppercase text-xs tracking-widest transition-all ${interviewAnswers[q.id] === opt ? 'bg-black border-black text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500 hover:border-blue-200'}`}>{opt}</button>
                          ))}
                        </div>
                        <TextArea value={interviewAnswers[q.id] || ""} onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))} className="min-h-[120px] rounded-2xl italic focus:bg-slate-50" placeholder="Elaborate further..." />
                      </div>
                  ))}
                 </div>
                 <button onClick={handleAnalyzeMatrix} className="mobbin-btn-primary w-full py-12 uppercase tracking-[0.6em] text-lg font-black italic shadow-2xl">GENERATE MATRIX</button>
              </div>
           </div>
        )}

        {/* RESULTS SCREEN */}
        {output && (
           <main className="absolute inset-0 z-[200] p-12 overflow-y-auto bg-white custom-scrollbar animate-fade-in">
               <div className="max-w-6xl mx-auto space-y-24">
                   <div className="flex justify-between items-end border-b-4 border-slate-100 pb-12">
                      <h3 className="text-[8vw] font-black italic leading-none tracking-tighter">FINAL.</h3>
                      <button onClick={() => { resetSynthesisState(); setGuidedState({ category: null, index: 0 }); }} className="mobbin-btn-primary uppercase text-[10px] tracking-widest font-black px-8 py-5 shadow-lg">New Project</button>
                   </div>
                   
                   <div className="space-y-8">
                      <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1.2em] uppercase italic">01. Architecture Spec</h4>
                      <div className="mobbin-card p-16 text-3xl font-medium leading-relaxed bg-[#FDFDFD] whitespace-pre-wrap">{output.APP_BLUEPRINT}</div>
                   </div>

                   <div className="space-y-8">
                      <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1.2em] uppercase italic">02. RODES Prompt</h4>
                      <div className="bg-[#141414] text-white/80 p-16 rounded-[4rem] font-mono text-lg leading-relaxed whitespace-pre-wrap shadow-2xl">{output.FINAL_PROMPT}</div>
                   </div>

                   {generatedVisual && (
                     <div className="space-y-8">
                        <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1.2em] uppercase italic">03. Synthesis Render</h4>
                        <div className="relative p-4 bg-slate-50 rounded-[6rem] border-2 border-slate-100 shadow-xl overflow-hidden group">
                          <img src={generatedVisual} className="w-full rounded-[5rem] shadow-2xl transition-all duration-1000 group-hover:scale-[1.03]" alt="Render" />
                        </div>
                     </div>
                   )}
               </div>
           </main>
        )}

        {/* ARCHIVE */}
        {activeTab === 'HISTORY' && (
           <div className="h-full overflow-y-auto bg-white custom-scrollbar animate-fade-in p-12">
             <div className="max-w-6xl mx-auto space-y-16">
               <h2 className="text-[9vw] font-black italic uppercase leading-none mb-16 tracking-tighter">Vault.</h2>
               {history.length === 0 ? (
                 <p className="text-4xl tracking-widest font-black uppercase italic opacity-10">Empty Vault</p>
               ) : (
                 <div className="grid grid-cols-1 gap-10">
                   {history.map(item => (
                     <div key={item.id} className="mobbin-card p-16 flex justify-between items-center cursor-pointer group hover:bg-blue-50 transition-all" onClick={() => { setOutput(item.output); setActiveTab('BUILD'); }}>
                       <div className="space-y-4">
                          <span className="text-[#0055FF] font-black uppercase text-[11px] tracking-[0.4em] italic">{new Date(item.timestamp).toLocaleDateString()}</span>
                          <h4 className="text-5xl font-black italic group-hover:text-[#0055FF] uppercase tracking-tighter truncate max-w-3xl">{item.input.high_level_goal?.substring(0, 50)}...</h4>
                       </div>
                       <Icons.Sparkles className="w-16 h-16 text-[#0055FF] opacity-0 group-hover:opacity-100 transition-opacity" />
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
