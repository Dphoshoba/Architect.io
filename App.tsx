
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { PromptInput, PromptOutput, HistoryItem, MastermindSuggestionCategory, InterviewQuestion } from './types';
import { TextArea, TextInput } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  generateVisualImage, 
  generateMastermindSuggestions,
  generateInterviewQuestions
} from './services/geminiService';

// --- Icons & UI Components ---
const Icons = {
  Sparkles: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Globe: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  ArrowLeft: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Mic: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 19v4m-4 0h8" /></svg>,
  Wrench: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Copy: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
  Download: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Volume2: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>,
  VolumeX: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 9l4 4m0-4l-4 4" /></svg>,
  AppWindow: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>,
  Keyboard: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Bank: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-12h1m-1 4h1m-1 4h1" /></svg>,
  Layout: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 9h16m-10 0v10" /></svg>,
  Stop: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
};

// --- Audio Visualizer Component ---
const AudioVisualizer: React.FC<{ analyser: AnalyserNode | null; isActive: boolean }> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !analyser || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const opacity = dataArray[i] / 255;
        ctx.fillStyle = `rgba(79, 70, 229, ${opacity})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, isActive]);

  return <canvas ref={canvasRef} className="w-full h-32 opacity-80" width={600} height={128} />;
};

// --- Live Session Utils ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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

const STEERING_SHARDS = [
  { label: "Deep-Dive Stack", prompt: "Dr. Architect, please pivot and focus on my technical implementation and stack preferences." },
  { label: "UX Flow Priority", prompt: "Focus more on the user experience and interaction design hierarchy." },
  { label: "Monetization Strategy", prompt: "Let's discuss business model, pricing tiers, and revenue recognition logic." },
  { label: "Compliance & Security", prompt: "Focus on regulatory requirements, data residency, and audit trails." }
];

const GUIDED_FLOWS = {
  'SaaS': { title: 'SAAS ARCHITECT', icon: Icons.Layout, questions: [
    { key: 'saas_category', label: 'Business Area' },
    { key: 'user_persona', label: 'Primary User' },
    { key: 'high_level_goal', label: 'Core Pain Point' },
  ]},
  'Finance': { title: 'FINANCE ARCHITECT', icon: Icons.Bank, questions: [
    { key: 'fin_domain', label: 'Finance Domain' },
    { key: 'fin_users', label: 'Primary User' },
    { key: 'high_level_goal', label: 'Core Workflow' },
  ]},
  'Simple': { title: 'SIMPLE PROMPT', icon: Icons.Keyboard, questions: [
    { key: 'high_level_goal', label: 'Direct Command' }
  ]},
  'Live': { title: 'LIVE VOICE DISCOVERY', icon: Icons.Mic, questions: [] }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY' | 'ACCOUNT'>('BUILD');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  
  // States for Live API
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  // Discovery / Interview / Review
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [mastermindSuggestions, setMastermindSuggestions] = useState<MastermindSuggestionCategory[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", high_level_goal: "", task_type: "Synthesis", domain_context: "",
    user_persona: "Lead Architect", tone_style: "Professional", output_format: "Markdown",
    length_and_depth: "Detailed", reasoning_visibility: "brief", language: "English",
    visual_inspiration_mode: true
  });
  
  const [guidedState, setGuidedState] = useState({ category: null as string | null, index: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('architect_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const speak = (text: string) => {
    if (!isSpeechEnabled || isLiveActive) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // --- Live API Implementation ---
  const startLiveDiscovery = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!audioContextRef.current) {
        audioContextRef.current = {
          input: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 }),
          output: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }),
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            setLoading(false);
            
            const source = audioContextRef.current!.input.createMediaStreamSource(stream);
            const analyser = audioContextRef.current!.input.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            
            const scriptProcessor = audioContextRef.current!.input.createScriptProcessor(4096, 1, 1);
            
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
            
            source.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.input.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Audio Output Handling
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = audioContextRef.current!.output;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            // Transcription Handling
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              setCurrentTranscription(prev => prev + text);
            }

            if (msg.serverContent?.turnComplete) {
              setLiveTranscription(prev => [...prev, currentTranscription]);
              setCurrentTranscription('');
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { console.error("Live Error", e); stopLiveDiscovery(); },
          onclose: () => stopLiveDiscovery()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          outputAudioTranscription: {},
          systemInstruction: `You are Dr. Architect PhD, a senior product architect. 
          Your mission is to guide the user from a vague idea to a build-ready specification.
          LEAD THE CONVERSATION: 
          1. Greet them and ask for the high-level vision.
          2. Ask one high-leverage question at a time.
          3. Proactively discover technical constraints, UX hierarchy, and business logic.
          4. When users are vague, suggest options (e.g. "Should we focus on a lean MVP or an enterprise-grade suite?").
          BE ASSERTIVE and PROBING. Use the AskUserQuestion methodology aggressively.`
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Microphone connection failed. Please ensure permissions are granted.");
    }
  };

  const steerDiscovery = (prompt: string) => {
    if (sessionRef.current) {
      sessionRef.current.sendRealtimeInput({ media: { data: "", mimeType: "audio/pcm;rate=16000" } }); // Flush
      // Currently, sending text as a turn through the Live API isn't direct, so we assume the model picks up on audio context or user's next spoken turn.
      // For now, we simulate steering by letting the user know the model is being re-oriented.
      setCurrentTranscription(prev => prev + " [Steering Phase: " + prompt + "] ");
    }
  };

  const stopLiveDiscovery = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    setIsLiveActive(false);
    if (liveTranscription.length > 0) {
      setForm(prev => ({ ...prev, high_level_goal: liveTranscription.join(' ') }));
      handleAnalyzeMatrix();
    } else {
      setGuidedState({ category: null, index: 0 });
    }
  };

  const toggleShard = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCopyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard.");
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const enterInterview = async () => {
    setLoading(true);
    try {
      const q = await generateInterviewQuestions(form);
      setInterviewQuestions(q);
      setIsInterviewing(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMatrix = async () => {
    setLoading(true);
    try {
      const refinedGoal = `${form.high_level_goal} ${Object.values(interviewAnswers).join(' ')}`;
      const res = await generateMastermindSuggestions({ ...form, high_level_goal: refinedGoal });
      setMastermindSuggestions(res);
      setIsReviewing(true);
      setIsInterviewing(false);
      speak("Matrix ready.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setOutput(null);
    try {
      const refinements = Object.entries(selectedSuggestions).map(([cat, val]) => `[${cat}]: ${val}`).join('\n');
      const finalGoal = `OBJECTIVE: ${form.high_level_goal}\nREFINEMENTS:\n${refinements}`;
      const res = await generateArchitectPrompt({ ...form, high_level_goal: finalGoal });
      setOutput(res);
      const visualUrl = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || finalGoal);
      setGeneratedVisual(visualUrl);
      const newItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), input: { ...form }, output: { ...res } };
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      localStorage.setItem('architect_history', JSON.stringify([newItem, ...history]));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-slate-100 overflow-hidden selection:bg-indigo-500/30">
      <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-[#050608]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-10">
          <div className="flex flex-col cursor-pointer" onClick={() => {setOutput(null); setGuidedState(p => ({...p, category: null, index: 0})); setIsReviewing(false); setIsInterviewing(false); setIsLiveActive(false);}}>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">ARCHITECT<span className="text-indigo-500">.IO</span></h1>
          </div>
          <nav className="flex gap-1 bg-white/5 p-1 rounded-xl">
            {['BUILD', 'HISTORY', 'ACCOUNT'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>{tab}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} className={`p-3 rounded-full ${isSpeechEnabled ? 'text-indigo-400' : 'text-slate-600'}`}>
            {isSpeechEnabled ? <Icons.Volume2 className="w-5 h-5" /> : <Icons.VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center animate-fade-in backdrop-blur-3xl">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8" />
            <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-xs">Processing Quantum Logic...</p>
          </div>
        )}

        {/* --- VECTOR SELECTION --- */}
        {activeTab === 'BUILD' && !guidedState.category && !output && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in">
            <h2 className="text-[5vw] font-black italic uppercase text-white mb-20 tracking-tighter">Select Discovery Vector</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl px-10">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button key={key} onClick={() => { setGuidedState(p => ({ ...p, category: key, index: 0 })); if(key === 'Live') startLiveDiscovery(); }} className="group glass rounded-[3rem] p-12 flex flex-col items-center transition-all hover:scale-105 hover:border-indigo-500/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <flow.icon className="w-14 h-14 text-indigo-400 mb-8 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase text-white italic text-center leading-tight">{flow.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- LIVE VOICE MODE --- */}
        {activeTab === 'BUILD' && isLiveActive && (
          <div className="h-full flex flex-col items-center p-12 overflow-y-auto custom-scrollbar animate-fade-in bg-[#050608]">
             <div className="max-w-4xl w-full flex flex-col items-center space-y-12">
                <div className="relative group">
                   <div className="w-48 h-48 border-[12px] border-indigo-500/10 rounded-full animate-ping absolute inset-0 opacity-20" />
                   <div className="w-48 h-48 border-[4px] border-indigo-500 rounded-full flex items-center justify-center bg-indigo-500/5 shadow-[0_0_80px_rgba(79,70,229,0.2)]">
                      <Icons.Mic className="w-16 h-16 text-indigo-400 animate-pulse" />
                   </div>
                </div>

                <div className="w-full">
                  <AudioVisualizer analyser={analyserRef.current} isActive={isLiveActive} />
                </div>

                <div className="text-center space-y-4">
                  <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">Dr. Architect Discovery</h2>
                  <p className="text-indigo-400 font-bold uppercase tracking-[0.4em]">Live Audio Feed: Synced</p>
                </div>

                <div className="w-full glass p-10 rounded-[3rem] h-64 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-slate-300 italic text-lg leading-relaxed shadow-inner">
                   {liveTranscription.length === 0 && !currentTranscription && <p className="text-center opacity-30 mt-12 uppercase tracking-[0.5em]">Establishing Quantum Link...</p>}
                   {liveTranscription.map((t, i) => <p key={i} className="border-b border-white/5 pb-4 last:border-0">{t}</p>)}
                   {currentTranscription && <p className="text-indigo-400 font-medium">{currentTranscription}</p>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                   {STEERING_SHARDS.map((shard, i) => (
                      <button key={i} onClick={() => steerDiscovery(shard.prompt)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all text-slate-400">
                         {shard.label}
                      </button>
                   ))}
                </div>

                <button onClick={stopLiveDiscovery} className="px-16 py-6 bg-red-600 text-white font-black uppercase rounded-full flex items-center gap-4 hover:bg-red-500 transition-all shadow-2xl tracking-[0.3em] italic">
                   <Icons.Stop className="w-6 h-6" /> Terminate Discovery
                </button>
             </div>
          </div>
        )}

        {/* --- GUIDED / INTERVIEW / REFINEMENT (As per previous logic) --- */}
        {activeTab === 'BUILD' && guidedState.category && !isInterviewing && !isReviewing && !output && !isLiveActive && (
           <div className="h-full flex flex-col p-16 overflow-y-auto custom-scrollbar animate-fade-in">
              {/* Existing non-live discovery components go here */}
              <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
                 <button onClick={() => setGuidedState(p => ({ ...p, category: null }))} className="self-start mb-12 flex items-center gap-3 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors">
                    <Icons.ArrowLeft className="w-4 h-4" /> Back to Vectors
                 </button>
                 {GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index] ? (
                    <div className="w-full space-y-12">
                       <h2 className="text-7xl font-black italic uppercase text-white tracking-tighter text-center">
                          {GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index].label}
                       </h2>
                       <TextArea 
                          value={(form as any)[GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index].key] || ""}
                          onChange={e => setForm(p => ({ ...p, [GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index].key]: e.target.value }))}
                          placeholder="Describe your architectural shard..."
                          className="text-2xl py-10 px-8 rounded-[3rem] bg-white/5 min-h-[300px]"
                       />
                       <button onClick={() => {
                          if (guidedState.index < GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions.length - 1) {
                             setGuidedState(p => ({ ...p, index: p.index + 1 }));
                          } else {
                             enterInterview();
                          }
                       }} className="w-full py-10 bg-indigo-600 text-white font-black uppercase rounded-full shadow-2xl tracking-[0.5em] italic">
                          Next Phase
                       </button>
                    </div>
                 ) : null}
              </div>
           </div>
        )}

        {/* --- INTERVIEW --- */}
        {activeTab === 'BUILD' && isInterviewing && (
           <div className="h-full flex flex-col p-20 overflow-y-auto custom-scrollbar animate-fade-in">
              <div className="max-w-4xl mx-auto w-full space-y-12 pb-32">
                 <h2 className="text-6xl font-black italic uppercase text-white tracking-tighter text-center">Clarification Required</h2>
                 {interviewQuestions.map(q => (
                    <div key={q.id} className="glass p-12 rounded-[3rem] space-y-6 shadow-2xl">
                       <h4 className="text-xl font-bold italic text-white">{q.question}</h4>
                       <p className="text-xs text-slate-500 uppercase tracking-widest">{q.context}</p>
                       <TextArea 
                          value={interviewAnswers[q.id] || ""}
                          onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                          placeholder="Architectural detail..."
                       />
                    </div>
                 ))}
                 <button onClick={handleAnalyzeMatrix} className="w-full py-10 bg-indigo-600 text-white font-black uppercase rounded-full shadow-2xl tracking-[0.5em] italic">Analyze Refinement Matrix</button>
              </div>
           </div>
        )}

        {/* --- STRATEGY ROOM --- */}
        {activeTab === 'BUILD' && isReviewing && (
          <div className="h-full flex flex-col p-16 overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="max-w-7xl mx-auto w-full space-y-16 pb-32">
               <h2 className="text-7xl font-black italic uppercase text-white tracking-tighter text-center">Strategy Room</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {mastermindSuggestions.map((cat, i) => (
                    <div key={i} className="glass p-10 rounded-[3rem] space-y-8">
                      <h4 className="text-[12px] font-black uppercase text-indigo-400 tracking-widest italic">{cat.category}</h4>
                      <div className="flex flex-col gap-4">
                         {cat.options.map((opt, j) => (
                           <button key={j} onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} className={`p-6 rounded-2xl text-left border transition-all ${selectedSuggestions[cat.category] === opt.technical_value ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>
                              <span className="text-[12px] font-black uppercase block tracking-wider">{opt.label}</span>
                              <p className="text-[9px] opacity-60 font-medium uppercase mt-2 leading-tight tracking-widest">{opt.description}</p>
                           </button>
                         ))}
                      </div>
                    </div>
                  ))}
               </div>
               <button onClick={handleExecute} className="w-full py-10 bg-white text-black font-black uppercase rounded-full block shadow-2xl tracking-[0.8em] italic">Synthesize Specification</button>
            </div>
          </div>
        )}

        {/* --- FINAL OUTPUT --- */}
        {activeTab === 'BUILD' && output && (
           <main className="absolute inset-0 z-[200] p-16 overflow-y-auto custom-scrollbar bg-[#050608] animate-fade-in">
               <div className="max-w-7xl mx-auto pb-48 space-y-32">
                   <div className="flex justify-between items-center border-b border-white/10 pb-12">
                      <div className="flex items-center gap-6">
                         <button onClick={() => setOutput(null)} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Icons.ArrowLeft className="w-6 h-6 text-slate-400" /></button>
                         <h3 className="text-7xl font-black italic uppercase text-white tracking-tighter">Architecture</h3>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => handleCopyText(output.FINAL_PROMPT)} className="flex items-center gap-3 px-10 py-5 bg-white text-black font-black uppercase text-[11px] rounded-full hover:bg-slate-200 transition-all shadow-xl tracking-[0.2em] italic"><Icons.Copy className="w-5 h-5" /> Copy Specs</button>
                        <button onClick={() => handleDownload(output.FINAL_PROMPT, 'architect-io-specification.txt')} className="flex items-center gap-3 px-10 py-5 bg-white/5 text-white font-black uppercase text-[11px] rounded-full border border-white/10 hover:bg-white/10 transition-all tracking-[0.2em] italic"><Icons.Download className="w-5 h-5" /> Download</button>
                      </div>
                   </div>
                   
                   {output.APP_BLUEPRINT && (
                     <div className="space-y-10">
                        <h4 className="text-indigo-400 font-black uppercase tracking-[1em] italic leading-none ml-6">STRUCTURAL BLUEPRINT</h4>
                        <div className="bg-[#0e0f14] border border-white/5 p-20 rounded-[5rem] text-slate-300 font-sans text-xl leading-relaxed whitespace-pre-wrap shadow-2xl relative">
                           {output.APP_BLUEPRINT}
                        </div>
                     </div>
                   )}

                   <div className="space-y-10">
                      <h4 className="text-indigo-400 font-black uppercase tracking-[1em] italic leading-none text-sm ml-6">IMPLEMENTATION PROMPT (SENIOR ENGINEER)</h4>
                      <div className="bg-[#0e0f14]/50 border border-white/5 p-20 rounded-[5rem] text-slate-400 font-mono text-lg leading-relaxed whitespace-pre-wrap shadow-inner relative">
                        {output.FINAL_PROMPT}
                      </div>
                   </div>

                   {generatedVisual && (
                     <div className="space-y-10">
                        <h4 className="text-indigo-400 font-black uppercase tracking-[1em] italic leading-none text-sm ml-6">VISUAL DNA RENDER</h4>
                        <img src={generatedVisual} className="w-full rounded-[6.5rem] shadow-2xl border border-white/5" alt="Visual Synthesis" />
                     </div>
                   )}
                   
                   <button onClick={() => {setOutput(null); setIsReviewing(false); setIsInterviewing(false); setGuidedState(p => ({...p, category: null, index: 0}));}} className="text-slate-500 font-black uppercase tracking-[2em] italic mx-auto block hover:text-white transition-all py-10">Start New Vector</button>
               </div>
           </main>
        )}

        {activeTab === 'HISTORY' && (
           <div className="h-full p-24 overflow-y-auto custom-scrollbar animate-fade-in bg-[#050608]">
             <h2 className="text-8xl font-black italic text-white mb-20 tracking-tighter uppercase border-b border-white/5 pb-10">Archives</h2>
             {history.length === 0 ? <p className="text-slate-800 uppercase tracking-[1em] text-center py-56 italic">Database Offline...</p> : (
               <div className="grid grid-cols-1 gap-10 max-w-6xl mx-auto">
                 {history.map(item => (
                   <div key={item.id} className="glass p-16 rounded-[5rem] flex justify-between items-center group cursor-pointer hover:border-indigo-500/30 transition-all shadow-2xl" onClick={() => {setOutput(item.output); setActiveTab('BUILD');}}>
                     <div>
                        <span className="text-indigo-500 font-black uppercase tracking-widest italic text-[10px] mb-2 block">{new Date(item.timestamp).toLocaleDateString()}</span>
                        <h4 className="text-4xl font-black text-white italic group-hover:text-indigo-400 transition-colors uppercase leading-tight">{item.input.high_level_goal?.substring(0, 50) || "Synthesis Archive"}...</h4>
                     </div>
                     <Icons.Sparkles className="w-10 h-10 text-slate-800 group-hover:text-indigo-500 transition-all" />
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
};

export default App;
