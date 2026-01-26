
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
  Download: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
};

// --- Helpers ---
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

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

const GUIDED_FLOWS = {
  'Engineering': { title: 'ENGINEERING', icon: Icons.Cpu, questions: [{ key: 'eng_field', label: 'Tech Domain' }, { key: 'high_level_goal', label: 'Project Goal' }] },
  'Real Estate': { title: 'REAL ESTATE', icon: Icons.Home, questions: [{ key: 'estate_style', label: 'Property Style' }, { key: 'high_level_goal', label: 'Spatial Goal' }] },
  'Artist': { title: 'ART & CREATIVE', icon: Icons.Palette, questions: [{ key: 'artist_medium', label: 'Medium' }, { key: 'high_level_goal', label: 'Art Concept' }] },
  'Image': { title: 'VISUAL ASSET', icon: Icons.Photo, questions: [{ key: 'img_lighting', label: 'Vibe & Light' }, { key: 'high_level_goal', label: 'Visual Scene' }] },
  'Video': { title: 'MOTION / VIDEO', icon: Icons.Video, questions: [{ key: 'vid_style', label: 'Style' }, { key: 'high_level_goal', label: 'Story/Action' }] },
  'Website': { title: 'WEB & SAAS', icon: Icons.Globe, questions: [{ key: 'web_type', label: 'Product Type' }, { key: 'web_aesthetic', label: 'Design Vibe' }, { key: 'high_level_goal', label: 'Core Concept' }] },
  'Live': { title: 'VOICE CHAT', icon: Icons.Mic, questions: [] }
};

const SHARDS = {
  eng_field: [{ label: "Software", desc: "Apps & Systems" }, { label: "Machines", desc: "Hardware Design" }, { label: "AI Models", desc: "Machine Learning" }],
  estate_style: [{ label: "Modern", desc: "Clean & Simple" }, { label: "Cozy", desc: "Warm & Traditional" }, { label: "Industrial", desc: "Raw & Structural" }],
  artist_medium: [{ label: "Digital Art", desc: "Screen-based" }, { label: "Painting", desc: "Physical Canvas" }, { label: "3D Art", desc: "Sculpted/Modeled" }],
  img_lighting: [{ label: "Cinematic", desc: "Mood & Drama" }, { label: "Natural", desc: "Bright & Open" }, { label: "Neon", desc: "Cyberpunk Vibe" }],
  vid_style: [{ label: "Realistic", desc: "Life-like" }, { label: "Anime", desc: "Stylized Motion" }, { label: "Fast Action", desc: "High Energy" }],
  web_type: [{ label: "Non-Profit", desc: "Community & Charity" }, { label: "SaaS App", desc: "Business Tool" }, { label: "Portfolio", desc: "Showcase" }, { label: "Commerce", desc: "Online Store" }],
  web_aesthetic: [
    { label: "Welcoming", desc: "Modern & Clean Layout" },
    { label: "Impactful", desc: "Bold & Cinematic Presence" }
  ]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY'>('BUILD');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guidedState, setGuidedState] = useState({ category: null as string | null, index: 0 });
  const [isSimpleMode, setIsSimpleMode] = useState(true);

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
    user_persona: "Lead Architect", tone_style: "Professional", output_format: "Markdown",
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
    const saved = localStorage.getItem('architect_mobbin_v3');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadText = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartFlow = async () => {
    setLoading(true);
    try {
      const res = await generateInterviewQuestions({ ...form, isSimpleMode });
      setInterviewQuestions(res);
      setIsInterviewing(true);
    } catch (e) { 
      console.error("Interview Gen Error:", e);
      alert("Encountered an issue starting the plan. Check network/API key."); 
    } finally { setLoading(false); }
  };

  const handleAnalyzeMatrix = async () => {
    setLoading(true);
    try {
      const refinedGoal = `${form.high_level_goal} ${Object.values(interviewAnswers).join(' ')}`;
      const res = await generateMastermindSuggestions({ ...form, high_level_goal: refinedGoal, isSimpleMode });
      setMastermindSuggestions(res);
      setIsReviewing(true);
      setIsInterviewing(false);
    } catch (e) { 
      console.error("Analysis Error:", e);
      alert("Matrix analysis failed.");
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
      const newItem = { id: Date.now().toString(), timestamp: Date.now(), input: { ...form, isSimpleMode }, output: { ...res } };
      const newHist = [newItem, ...history];
      setHistory(newHist);
      localStorage.setItem('architect_mobbin_v3', JSON.stringify(newHist));
    } catch (e) { 
      console.error("Final Synthesis Error:", e);
      alert("Final architectural blueprint could not be finalized. Payload size may be the issue.");
    } finally { setLoading(false); }
  };

  const stopLiveDiscovery = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (sourcesRef.current) {
        for (const source of sourcesRef.current) {
          source.stop();
        }
        sourcesRef.current.clear();
    }
    setIsLiveActive(false);
    setGuidedState({ category: null, index: 0 });
    setMicLevel(0);
    setLiveTranscription([]);
  };

  const startLiveDiscovery = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!audioContextInRef.current) audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (!audioContextOutRef.current) audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLoading(false);
            setIsLiveActive(true);
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setMicLevel(Math.sqrt(sum / inputData.length));

              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob as any });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              const ctx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.outputTranscription) {
              setLiveTranscription(prev => [...prev, message.serverContent!.outputTranscription!.text]);
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            stopLiveDiscovery();
          },
          onclose: () => {
            stopLiveDiscovery();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are a friendly project assistant. Help the user explain their project idea. Use ${isSimpleMode ? 'plain English and avoid all technical terms' : 'professional architecture terminology'}. Be brief and encouraging.`,
          outputAudioTranscription: {},
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("Microphone access is required for Voice Chat.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden text-[#141414] font-sans selection:bg-[#0055FF]/10">
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-8 glass-header fixed top-0 w-full z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setOutput(null); setGuidedState({ category: null, index: 0 }); setIsReviewing(false); setIsInterviewing(false); if(isLiveActive) stopLiveDiscovery(); }}>
            <div className="w-8 h-8 bg-[#141414] rounded-lg flex items-center justify-center text-white font-black text-xs group-hover:scale-110 transition-transform">M</div>
            <h1 className="text-xl font-black uppercase tracking-tighter">{isSimpleMode ? 'PROJECT' : 'ARCHITECT'}<span className="text-[#0055FF]">.IO</span></h1>
          </div>
          <nav className="flex gap-6">
            {['BUILD', 'HISTORY'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`text-[11px] font-bold tracking-widest uppercase transition-all ${activeTab === tab ? 'text-[#141414] border-b-2 border-[#141414]' : 'text-slate-400 hover:text-black'}`}
              >
                {tab === 'BUILD' ? (isSimpleMode ? 'PLAN' : 'BUILD') : 'ARCHIVE'}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
            <button 
                onClick={() => { setIsSimpleMode(!isSimpleMode); setForm(f => ({...f, isSimpleMode: !isSimpleMode})); }}
                className={`flex items-center gap-2 p-1.5 px-4 rounded-full transition-all border ${isSimpleMode ? 'bg-[#0055FF]/5 border-[#0055FF]/20' : 'bg-slate-100 border-transparent'}`}
            >
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isSimpleMode ? 'text-[#0055FF]' : 'text-slate-500'}`}>Simple Mode</span>
                <div className={`w-3 h-3 rounded-full transition-all ${isSimpleMode ? 'bg-[#0055FF] scale-125' : 'bg-slate-300'}`} />
            </button>
            <button className="mobbin-btn-primary text-[10px] uppercase tracking-[0.2em] px-6 py-2.5 shadow-sm">Join free</button>
        </div>
      </header>

      <div className="flex-1 mt-16 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/95 flex flex-col items-center justify-center animate-fade-in backdrop-blur-xl">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0055FF] rounded-full animate-spin mb-6" />
            <p className="font-black text-[12px] uppercase tracking-[0.3em] text-slate-400">{isSimpleMode ? 'Preparing Blueprint...' : 'Synthesizing Architecture...'}</p>
          </div>
        )}

        {/* VOICE CHAT UI */}
        {activeTab === 'BUILD' && isLiveActive && (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white animate-fade-in overflow-y-auto">
                <div className="max-w-2xl w-full flex flex-col items-center gap-12">
                    <div className="flex items-center gap-3 h-16">
                        {[...Array(7)].map((_, i) => (
                            <div 
                              key={i} 
                              className="w-2 bg-[#0055FF] rounded-full transition-all duration-75" 
                              style={{ height: `${Math.max(12, micLevel * (200 + i * 40))}px` }} 
                            />
                        ))}
                    </div>
                    <div className="text-center">
                        <h2 className="text-5xl font-black uppercase italic mb-4 leading-none">{isSimpleMode ? 'Listening...' : 'Capturing Stream...'}</h2>
                        <p className="text-slate-500 font-medium text-lg italic">{isSimpleMode ? "Describe your vision out loud." : "Synchronizing PCM data with Discovery Engine."}</p>
                    </div>
                    <div className="w-full bg-slate-50 rounded-[3rem] p-12 h-64 overflow-y-auto custom-scrollbar border border-black/5 text-xl font-medium leading-relaxed text-[#141414] shadow-inner">
                        {liveTranscription.length === 0 ? (isSimpleMode ? "Speak now..." : "Awaiting input...") : liveTranscription.join(' ')}
                    </div>
                    <button onClick={stopLiveDiscovery} className="mobbin-btn-primary px-20 py-6 flex items-center gap-4 text-xs tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                        <Icons.Stop className="w-6 h-6" /> {isSimpleMode ? "END CALL" : "TERMINATE SESSION"}
                    </button>
                </div>
            </div>
        )}

        {/* CATEGORY SELECTION */}
        {activeTab === 'BUILD' && !guidedState.category && !output && !isLiveActive && (
          <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto custom-scrollbar">
            <div className="text-center mb-20 max-w-4xl">
              <h2 className="text-[8vw] mb-6 uppercase italic leading-[0.8] font-black tracking-tighter">{isSimpleMode ? 'What are we making?' : 'Product Synthesis.'}</h2>
              <p className="text-slate-400 font-medium text-xl leading-relaxed">{isSimpleMode ? 'Select a category below to start your building plan.' : 'Select a specialized discovery engine to begin high-fidelity architecture.'}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5 w-full max-w-7xl mb-24 px-6">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button 
                  key={key} 
                  onClick={() => { setGuidedState({ category: key, index: 0 }); if(key === 'Live') startLiveDiscovery(); }} 
                  className="group mobbin-card p-10 flex flex-col items-center text-center hover:border-[#0055FF] hover:bg-[#0055FF]/5 transition-all shadow-sm"
                >
                  <flow.icon className="w-12 h-12 text-[#0055FF] mb-8 group-hover:scale-125 transition-transform" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest leading-none">{flow.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GUIDED FLOWS */}
        {activeTab === 'BUILD' && guidedState.category && !isInterviewing && !isReviewing && !output && !isLiveActive && (
          <div className="h-full flex flex-col p-12 overflow-y-auto custom-scrollbar bg-white">
            <div className="max-w-6xl mx-auto w-full space-y-20 py-16">
              <div className="flex justify-between items-center relative z-10">
                <button onClick={() => setGuidedState({ category: null, index: 0 })} className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest italic hover:text-black group">
                  <Icons.ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> {isSimpleMode ? 'Go Back' : 'Back to selection'}
                </button>
                <div className="flex items-center gap-4">
                  {form.media_ref_base64 && (
                    <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-md">
                      {form.media_type === 'image' ? (
                        <img src={`data:image/png;base64,${form.media_ref_base64}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100"><Icons.Video className="w-6 h-6 text-slate-400" /></div>
                      )}
                    </div>
                  )}
                  <label className="mobbin-btn-secondary px-6 py-3 text-[10px] cursor-pointer flex items-center gap-2 border-slate-300">
                    <Icons.Upload className="w-4 h-4" />
                    {isSimpleMode ? 'UPLOAD REF' : 'ATTACH SOURCE'}
                    <input type="file" className="hidden" accept="image/*,video/*,audio/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-[8vw] italic uppercase font-black tracking-tighter leading-none">{GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.label}</h2>
                <p className="text-[#0055FF] font-black uppercase tracking-[0.5em] text-[12px] italic">Step {guidedState.index + 1} of {GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions.length}</p>
              </div>
              {(() => {
                const q = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index];
                if (!q) return null;
                const options = (SHARDS as any)[q.key] || [];
                return q.key === 'high_level_goal' ? (
                  <div className="relative z-0">
                    <TextArea 
                      autoFocus
                      value={(form as any)[q.key] || ""} 
                      onChange={e => setForm(p => ({ ...p, [q.key]: e.target.value }))} 
                      style={{ color: '#141414', backgroundColor: '#FFFFFF' }}
                      className="max-w-5xl mx-auto mobbin-input text-4xl py-14 min-h-[450px] border-4 border-slate-100 shadow-3xl focus:border-[#0055FF] rounded-[5rem] placeholder:text-slate-100" 
                      placeholder={isSimpleMode ? "Type your idea here..." : "Input core technical objectives..."} 
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-8 max-w-7xl mx-auto px-4">
                    {options.map((opt: any) => (
                      <button 
                        key={opt.label} 
                        onClick={() => setForm(p => ({ ...p, [q.key]: opt.label }))} 
                        className={`p-10 mobbin-card transition-all flex flex-col items-center gap-4 border-2 shadow-sm ${(form as any)[q.key] === opt.label ? 'bg-[#141414] text-white border-[#141414] scale-105 shadow-3xl' : 'text-slate-600 hover:border-[#0055FF]/40 border-slate-100'}`}
                      >
                        <span className="text-lg font-black uppercase tracking-wider">{opt.label}</span>
                        <span className={`text-[11px] uppercase font-bold tracking-tight ${ (form as any)[q.key] === opt.label ? 'text-[#0055FF]' : 'text-slate-400' }`}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
              <div className="flex justify-center pt-24 relative z-10">
                 <button 
                  onClick={() => {
                   if (guidedState.index < GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions.length - 1) setGuidedState(p => ({ ...p, index: p.index + 1 }));
                   else handleStartFlow();
                  }} 
                  className="mobbin-btn-primary px-48 py-8 uppercase italic tracking-[0.5em] text-sm shadow-3xl hover:scale-105 active:scale-95 transition-all"
                 >
                   PROCEED
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS PHASE */}
        {activeTab === 'BUILD' && isInterviewing && !isLiveActive && (
           <div className="h-full p-16 overflow-y-auto bg-white custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-20 py-16">
                 <div className="text-center">
                   <h2 className="text-9xl font-black italic uppercase leading-none tracking-tighter">{isSimpleMode ? 'Details.' : 'Probe.'}</h2>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mt-6 italic">{isSimpleMode ? 'Answer these simple questions to refine the plan.' : 'Resolving logical dependencies and clarifying constraints.'}</p>
                 </div>
                 <div className="space-y-10">
                  {interviewQuestions.map(q => (
                      <div key={q.id} className="mobbin-card p-14 space-y-10 border-2 border-slate-100 shadow-lg">
                        <div>
                          <h4 className="text-3xl font-black italic text-[#141414] mb-3 leading-tight">{q.question}</h4>
                          <p className="text-[11px] text-[#0055FF] uppercase tracking-widest font-black italic">{q.context}</p>
                        </div>
                        <TextArea 
                          value={interviewAnswers[q.id] || ""} 
                          onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))} 
                          style={{ color: '#141414', backgroundColor: '#F9FAFB' }}
                          className="min-h-[160px] text-2xl border-none shadow-inner rounded-[3rem] placeholder:text-slate-300 px-10 py-8" 
                          placeholder="Type response..." 
                        />
                      </div>
                  ))}
                 </div>
                 <button onClick={handleAnalyzeMatrix} className="mobbin-btn-primary w-full py-12 uppercase tracking-[0.6em] text-lg italic font-black shadow-3xl hover:bg-[#0055FF] transition-colors">FINALIZE MATRIX</button>
              </div>
           </div>
        )}

        {/* STYLE ROOM */}
        {activeTab === 'BUILD' && isReviewing && !isLiveActive && (
          <div className="h-full p-16 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-24 py-16">
               <div className="text-center">
                 <h2 className="text-[10vw] font-black italic uppercase leading-none tracking-tighter">{isSimpleMode ? 'Style.' : 'Strategy.'}</h2>
                 <p className="text-[#0055FF] font-black uppercase tracking-[0.6em] text-[12px] mt-10 italic">{isSimpleMode ? 'Choose the best style for your project.' : 'Finalizing high-fidelity architectural shards.'}</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {mastermindSuggestions.map((cat, i) => (
                    <div key={i} className="mobbin-card p-12 space-y-10 border-2 border-slate-100 shadow-3xl">
                      <h4 className="text-[12px] font-black uppercase text-[#0055FF] tracking-[0.4em] italic border-b-2 border-slate-100 pb-8">{cat.category}</h4>
                      <div className="flex flex-col gap-5">
                         {cat.options.map((opt, j) => (
                           <button 
                             key={j} 
                             onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} 
                             className={`p-10 rounded-[3rem] text-left border-2 transition-all ${selectedSuggestions[cat.category] === opt.technical_value ? 'bg-[#141414] border-[#141414] text-white shadow-3xl scale-[1.05]' : 'bg-white border-slate-50 text-slate-500 hover:border-[#0055FF]/30'}`}
                           >
                              <span className="text-[16px] font-black uppercase block mb-3 leading-none">{opt.label}</span>
                              <p className="text-[11px] opacity-70 font-medium uppercase leading-relaxed">{opt.description}</p>
                           </button>
                         ))}
                      </div>
                    </div>
                  ))}
               </div>
               <button onClick={handleSynthesize} className="mobbin-btn-primary w-full py-14 text-2xl uppercase tracking-[1.2em] italic font-black shadow-3xl">SYNTHESIZE BLUEPRINT</button>
            </div>
          </div>
        )}

        {/* FINAL PLAN */}
        {activeTab === 'BUILD' && output && !isLiveActive && (
           <main className="absolute inset-0 z-[200] p-12 overflow-y-auto bg-white animate-fade-in custom-scrollbar">
               <div className="max-w-6xl mx-auto pb-48 space-y-28">
                   <div className="flex justify-between items-end border-b-4 border-slate-100 pb-16">
                      <div>
                        <h3 className="text-[10vw] font-black italic leading-none tracking-tighter">{isSimpleMode ? 'READY.' : 'VERIFIED.'}</h3>
                        <p className="text-[#0055FF] font-black uppercase tracking-[0.5em] text-[12px] mt-10 italic">{isSimpleMode ? 'The building plan is ready.' : 'High-Fidelity Architecture Synthesized'}</p>
                      </div>
                      <div className="flex gap-6">
                        <button onClick={() => { setOutput(null); setGuidedState({ category: null, index: 0 }); setIsReviewing(false); }} className="mobbin-btn-secondary uppercase text-xs tracking-widest italic font-black px-10 py-5 border-2 border-slate-200">NEW PROJECT</button>
                      </div>
                   </div>
                   
                   {/* SECTION 01: BLUEPRINT */}
                   {output.APP_BLUEPRINT && (
                     <div className="space-y-10">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">01. {isSimpleMode ? 'BUILDING PLAN' : 'STRUCTURE'}</h4>
                          <div className="flex gap-3">
                            <button onClick={() => handleCopy(output.APP_BLUEPRINT!)} className="mobbin-btn-secondary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest border-slate-200 hover:bg-slate-50">
                              <Icons.Copy className="w-4 h-4" /> COPY
                            </button>
                            <button onClick={() => downloadText(output.APP_BLUEPRINT!, "blueprint.txt")} className="mobbin-btn-primary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest">
                              <Icons.Download className="w-4 h-4" /> DOWNLOAD
                            </button>
                          </div>
                        </div>
                        <div className="mobbin-card p-24 text-[#141414] text-4xl font-medium leading-relaxed whitespace-pre-wrap shadow-3xl border-2 border-slate-100 bg-[#fdfdfd]">{output.APP_BLUEPRINT}</div>
                     </div>
                   )}

                   {/* SECTION 02: AI IMPLEMENTATION / PROMPT */}
                   <div className="space-y-10">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">02. {isSimpleMode ? 'INSTRUCTIONS' : 'AI IMPLEMENTATION'}</h4>
                        <div className="flex gap-3">
                            <button onClick={() => handleCopy(output.FINAL_PROMPT)} className="mobbin-btn-secondary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest border-slate-200 hover:bg-slate-50">
                              <Icons.Copy className="w-4 h-4" /> COPY
                            </button>
                            <button onClick={() => downloadText(output.FINAL_PROMPT, "prompt_specification.txt")} className="mobbin-btn-primary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest">
                              <Icons.Download className="w-4 h-4" /> DOWNLOAD
                            </button>
                          </div>
                      </div>
                      <div className="bg-slate-50 border-2 border-slate-100 p-24 rounded-[5rem] text-slate-600 font-mono text-xl leading-relaxed whitespace-pre-wrap shadow-inner overflow-x-auto">{output.FINAL_PROMPT}</div>
                   </div>

                   {/* SECTION 03: VISUAL PREVIEW */}
                   {generatedVisual && (
                     <div className="space-y-10">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[#0055FF] text-[12px] font-black tracking-[1em] uppercase italic">03. {isSimpleMode ? 'VISUAL PREVIEW' : 'SYNTHESIS RENDER'}</h4>
                          <div className="flex gap-3">
                            <button onClick={() => downloadImage(generatedVisual, "architect_render.png")} className="mobbin-btn-primary py-2 px-6 flex items-center gap-2 text-[10px] tracking-widest">
                              <Icons.Download className="w-4 h-4" /> DOWNLOAD RENDER
                            </button>
                          </div>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[7rem] border-2 border-slate-100 shadow-sm">
                            <img src={generatedVisual} className="w-full rounded-[6rem] shadow-4xl" alt="Render" />
                        </div>
                     </div>
                   )}
               </div>
           </main>
        )}

        {/* ARCHIVE */}
        {activeTab === 'HISTORY' && (
           <div className="h-full p-20 overflow-y-auto bg-white custom-scrollbar">
             <div className="max-w-6xl mx-auto">
               <h2 className="text-[9vw] font-black italic uppercase leading-none mb-24 tracking-tighter">{isSimpleMode ? 'History.' : 'Archive.'}</h2>
               {history.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-64 opacity-10">
                    <Icons.Sparkles className="w-48 h-48 mb-12" />
                    <p className="text-4xl tracking-[1.5em] font-black uppercase italic">Empty Vault</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-10">
                   {history.map(item => (
                     <div 
                        key={item.id} 
                        className="mobbin-card p-16 flex justify-between items-center cursor-pointer group hover:bg-[#0055FF]/5 transition-all border-2 border-slate-100" 
                        onClick={() => { setOutput(item.output); setActiveTab('BUILD'); }}
                      >
                       <div className="space-y-4">
                          <span className="text-[#0055FF] font-black uppercase text-[11px] tracking-[0.4em] italic">{new Date(item.timestamp).toLocaleDateString()}</span>
                          <h4 className="text-6xl font-black italic group-hover:text-[#0055FF] transition-colors leading-tight uppercase tracking-tighter">{item.input.high_level_goal?.substring(0, 40)}...</h4>
                       </div>
                       <Icons.Sparkles className="w-16 h-16 text-slate-100 group-hover:text-[#0055FF] group-hover:rotate-12 transition-all" />
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
