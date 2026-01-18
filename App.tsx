import React, { useState, useEffect, useRef } from 'react';
import { PromptInput, PromptOutput, MarketingKit, TargetAI, UserStatus, HistoryItem, MastermindSuggestionCategory } from './types';
import { TextArea, Select, TextInput } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  generateVisualImage, 
  generateMarketingKit,
  generateMastermindSuggestions
} from './services/geminiService';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const Icons = {
  Sparkles: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Globe: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  ChevronDown: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
  ArrowLeft: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Robot: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V5.73c-.6-.34-1-1-1-1.73a2 2 0 0 1 2-2M9 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2m6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2M9 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2m6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /></svg>,
  Photo: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Mic: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 19v4m-4 0h8" /></svg>,
  Wrench: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Copy: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
  Download: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Share: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  Trash: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Volume2: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>,
  VolumeX: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 9l4 4m0-4l-4 4" /></svg>,
  Cpu: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
};

const MASTERMIND_COACH_INSIGHTS = {
  'Website': [
    "Identify your Platform DNA carefully. It dictates the underlying logic for all subsequent UX decisions.",
    "Layout Shards determine the conversion flow. For luxury, prioritize negative space; for SaaS, prioritize clarity.",
    "The Aesthetic layer is your brand's visceral signature. Glassmorphism signals modern transparency.",
    "Typography is the voice of your text. Choose Modern Sans for tech-forward credibility.",
    "Color Matrix triggers psychological responses. Midnight and Blue signal security and professional depth.",
    "System Tone must align with your audience's expectations. Professionalism is the default for high-trust environments.",
    "Your Core Directive is the functional anchor. Keep it focused on a single primary conversion goal.",
    "Presentation Style is about accessibility. Markdown is excellent for collaborative documentation."
  ],
  'Professional': [
    "Your Domain sets the regulatory boundary. Choose Interior Design for spatial logic, or SaaS for structural architecture.",
    "Expertise determines the 'Intelligence Density'. Senior Principal levels unlock advanced reasoning patterns.",
    "Protocol Type defines the legal weight of the output. BoQs require extreme numerical precision.",
    "Compliance Standards are non-negotiable. ISO 9001 ensures global operational quality.",
    "Visual DNA maintains professional decorum. Minimize distractions to focus on functional data.",
    "System Tone should be academic yet actionable. Precision is favored over persuasion.",
    "Task Logic is the algorithmic engine. Strategic Synthesis is best for complex infrastructure maps.",
    "Final Format ensures cross-team compatibility. JSON is preferred for automated systems integration."
  ],
  'Image': [
    "The Neural Subject is the epicenter of the render. Hyper-realism requires high subject-detail contrast.",
    "Lighting is the soul of photography. Volumetric God-Rays add divine cinematic weight.",
    "Perspective defines the viewer's power. Bird's Eye View provides total strategic oversight.",
    "Artistic DNA links the image to history. Brutalism emphasizes raw, uncompromising structure.",
    "Frame Ratio must serve the medium. 16:9 is the cinematic standard for wide-angle world building.",
    "Render Detail is a computational choice. Ultra quality ensures pixel-perfect fidelity for 4K displays.",
    "Emotional Mood sets the psychological stage. Vibe is as important as technical precision.",
    "Metadata Style summarizes the intent. Ensure the summary serves as a clear blueprint for the GPU."
  ],
  'Live': [
    "Voice Persona determines the persona's empathy level. Zephyr is optimized for helpful architectural consultation."
  ]
};

const SHARDS = {
  web_type: ["Luxury Salon", "SaaS Analytics", "Fashion E-commerce", "Architect Portfolio", "EdTech LMS", "Boutique Hotel", "Healthcare Portal", "Real Estate Engine", "Logistics Hub", "Creative Agency", "Restaurant / Menu", "Esports Community", "Event Microsite"],
  web_layout_blocks: ["Full Hero", "Split Hero", "Bento Grid", "Parallax Sections", "Sticky Mega-Menu", "Masonry Gallery", "Pricing Matrix", "Comparison Table", "Stats Overlay", "Testimonial Carousel", "Interactive Timeline", "Accordion FAQ", "Video Background", "Floating CTA"],
  web_aesthetic: ["Glassmorphism", "Minimalist White", "Futuristic Dark", "Editorial Serif", "Neumorphism", "Raw Brutalist", "Cinematic Wide", "Apple-style Polish", "Clean SaaS Blue", "Retro 80s Cyber", "Monochrome Luxury"],
  web_typography: ["Modern Sans (Inter)", "Editorial Serif (Playfair)", "Technical Mono (JetBrains)", "Bold Display (Bebas)", "System Native (SF Pro)", "Geometric Sans (Poppins)"],
  web_colors: ["Midnight (#050608)", "SaaS Blue (#2563EB)", "Electric Indigo (#6366F1)", "Emerald Glow", "Golden Noir", "Slate & Snow", "Cyber Gradient"],
  prof_domain: ["Interior Design", "Civil Engineering", "Landscaping", "Land Surveying", "Quantity Surveying", "Software SaaS", "Structural Design", "Mechanical Simulation", "Environmental Audit", "Urban Planning", "Logistics Optimization", "Product Prototyping"],
  prof_expertise: ["Senior Principal Architect", "Lead Field Engineer", "Project Director", "Design Lead", "Technical Consultant", "Strategic Founder", "Executive Oversight"],
  prof_output_type: ["Bill of Quantities (BoQ)", "Site Audit Protocol", "Technical Specification (TS)", "Gantt Chart Logic", "Risk Assessment Suite", "Infrastructure Map", "SaaS Architecture Blueprint", "Material Inventory Table"],
  prof_standards: ["ISO 9001 Compliance", "AIA Contract Standards", "RICS Blue Book Rules", "ASCE Guidelines", "IEEE Standards", "RIBA Work Plan", "Eurocodes"],
  img_subject: ["Futuristic Cityscape", "Organic Character", "Industrial Product", "Surreal Landscape", "Minimalist Interior", "Hyper-realistic Portrait", "Cinematic Vehicle", "Botanical Hybrid", "Cosmic Nebula", "Cyberpunk Street", "Ancient Ruins", "Mythical Creature"],
  tone_style: ["Professional", "Concise", "Academic", "Creative", "Aggressive", "Empathetic", "Technical", "Instructional", "Socratic", "Philosophical"],
  task_type: ["Code Generation", "Strategic Synthesis", "Creative Writing", "Data Extraction", "Logical Reasoning", "Summarization", "Proofreading", "Transformation", "Audit"],
  output_format: ["Formatted Document (Markdown)", "Data Sheet (JSON)", "Plain Text Only", "Structured Bullet Points", "Professional Table", "Technical Script (Code)", "Config File (YAML)", "Blueprint Template"],
};

const GUIDED_FLOWS = {
  'Website': { title: 'WEBSITE CONSTRUCTOR', icon: Icons.Globe, questions: [
    { key: 'web_type', label: 'Platform DNA' },
    { key: 'web_layout_blocks', label: 'Layout Shards' },
    { key: 'web_aesthetic', label: 'Visual Aesthetic' },
    { key: 'web_typography', label: 'Typography' },
    { key: 'web_colors', label: 'Color Matrix' },
    { key: 'tone_style', label: 'Tone/Vibe' },
    { key: 'task_type', label: 'Main Directive' },
    { key: 'output_format', label: 'Final Presentation Style' },
  ]},
  'Professional': { title: 'INDUSTRIAL SUITE', icon: Icons.Wrench, questions: [
    { key: 'prof_domain', label: 'Expert Domain' },
    { key: 'prof_expertise', label: 'Seniority Level' },
    { key: 'prof_output_type', label: 'Protocol Type' },
    { key: 'prof_standards', label: 'Compliance Protocol' },
    { key: 'web_aesthetic', label: 'Visual DNA' },
    { key: 'tone_style', label: 'System Tone' },
    { key: 'task_type', label: 'Logical Task' },
    { key: 'output_format', label: 'Output Syntax' },
  ]},
  'Image': { title: 'IMAGE ARCHITECT', icon: Icons.Photo, questions: [
    { key: 'img_subject', label: 'Neural Subject' },
    { key: 'img_lighting', label: 'Lighting Matrix' },
    { key: 'img_composition', label: 'Perspective Angle' },
    { key: 'web_aesthetic', label: 'Artistic Style' },
    { key: 'aspect_ratio', label: 'Frame Ratio' },
    { key: 'visual_quality', label: 'Render Detail' },
    { key: 'tone_style', label: 'Emotional Mood' },
    { key: 'output_format', label: 'Technical Meta (Simplified)' },
  ]},
  'Live': { title: 'LIVE VOICE PROTOCOL', icon: Icons.Mic, questions: [
    { key: 'voice_name', label: 'Voice Persona' },
  ]}
};

const TARGET_MODELS: TargetAI[] = ["Gemini 3 Flash", "Gemini 3 Pro", "GPT-4o", "Claude 3.5 Sonnet", "DeepSeek R1"];

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

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
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY' | 'ACCOUNT'>('BUILD');
  const [isGuidedMode, setIsGuidedMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const [marketingKit, setMarketingKit] = useState<MarketingKit | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>({ userId: 'dev-user', plan: 'Starter', creditsRemaining: 100, totalCredits: 100 });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string[]>([]);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  
  const [mastermindSuggestions, setMastermindSuggestions] = useState<MastermindSuggestionCategory[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);

  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", high_level_goal: "", negative_prompt: "", task_type: "Synthesis", domain_context: "",
    user_persona: "Lead Prompt Architect", tone_style: "Professional", output_format: "Markdown",
    length_and_depth: "Detailed", reasoning_visibility: "brief", language: "English",
    visual_inspiration_mode: true
  });
  
  const [guidedState, setGuidedState] = useState({ 
    category: null as string | null, 
    index: 0,
    refinements: {} as Record<string, string>
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('architect_history');
    if (saved) setHistory(JSON.parse(saved));
    return () => {
        stopLiveSession();
        window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (!isSpeechEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes('Google') || v.lang.startsWith('en-US'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (activeTab === 'BUILD' && guidedState.category) {
        const flow = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS];
        if (flow && !isReviewing) {
            const question = flow.questions[guidedState.index];
            const insight = getCoachingInsight(guidedState.category, guidedState.index);
            speak(`${question.label}. ${insight}`);
        }
    }
  }, [guidedState.index, guidedState.category, activeTab, isReviewing]);

  useEffect(() => {
    if (isReviewing) {
        speak("Mastermind Strategy Room Active. Review my logic suggestions to finalize this masterpiece.");
    }
  }, [isReviewing]);

  const toggleShard = (key: string, value: string) => {
    const isSingle = ['target_AI', 'reasoning_visibility', 'language', 'visual_quality', 'aspect_ratio'].includes(key);
    if (isSingle) {
      setForm(prev => ({ ...prev, [key]: value }));
    } else {
      const current = (form as any)[key] || "";
      const items = current.split(', ').filter(Boolean);
      const updated = items.includes(value) ? items.filter((i: string) => i !== value) : [...items, value];
      setForm(prev => ({ ...prev, [key]: updated.join(', ') }));
    }
  };

  const updateRefinement = (key: string, value: string) => {
    setGuidedState(p => ({
      ...p,
      refinements: { ...p.refinements, [key]: value }
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(p => ({ ...p, media_ref_base64: reader.result as string, media_type: 'image' }));
        speak("Media shard synchronized.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Logic shard synchronized.");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleAnalyzeMatrix = async () => {
    setLoading(true);
    try {
      const res = await generateMastermindSuggestions({ ...form, high_level_goal: form.high_level_goal || "Awaiting Directive" });
      setMastermindSuggestions(res);
      setIsReviewing(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!form.high_level_goal && Object.keys(guidedState.refinements).length === 0) return;
    setLoading(true);
    setOutput(null);
    try {
      const mastermindRefinement = Object.entries(selectedSuggestions)
        .map(([cat, val]) => `\n[${cat} Protocol]: ${val}`)
        .join('');

      const aggregatedContext = `
        PRIMARY DIRECTIVE: ${form.high_level_goal}
        ${Object.entries(guidedState.refinements).map(([key, val]) => val ? `\n[${key} Context]: ${val}` : '').join('')}
        ${mastermindRefinement}
      `;

      const res = await generateArchitectPrompt({ ...form, high_level_goal: aggregatedContext });
      setOutput(res);

      const visualUrl = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || aggregatedContext);
      setGeneratedVisual(visualUrl);

      const kit = await generateMarketingKit(res.FINAL_PROMPT, aggregatedContext, form.language);
      setMarketingKit(kit);
      
      const newItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), input: { ...form, high_level_goal: aggregatedContext }, output: { ...res } };
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      localStorage.setItem('architect_history', JSON.stringify([newItem, ...history]));
      setUserStatus(p => ({ ...p, creditsRemaining: Math.max(0, userStatus.creditsRemaining - 10) }));
      speak("Synthesis complete.");
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startLiveSession = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            setLoading(false);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const base64 = encode(new Uint8Array(int16.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (msg.serverContent?.outputTranscription) setLiveTranscription(p => [...p, "AI: " + msg.serverContent!.outputTranscription!.text]);
            if (msg.serverContent?.inputTranscription) setLiveTranscription(p => [...p, "User: " + msg.serverContent!.inputTranscription!.text]);
          },
          onclose: () => stopLiveSession(),
          onerror: () => stopLiveSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "Lead the user with proactive PhD-level questions about their project."
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (e) {
      setLoading(false);
    }
  };

  const stopLiveSession = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsLiveActive(false);
  };

  const getCoachingInsight = (category: string, step: number) => {
    const insights = MASTERMIND_COACH_INSIGHTS[category as keyof typeof MASTERMIND_COACH_INSIGHTS];
    if (!insights) return "Evolve your logic.";
    return insights[step] || insights[insights.length - 1];
  };

  const selectMastermindOption = (category: string, option: string) => {
    setSelectedSuggestions(p => ({ ...p, [category]: option }));
  };

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-slate-100 overflow-hidden">
      <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-[#050608]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-10">
          <div className="flex flex-col cursor-pointer" onClick={() => {setOutput(null); setGuidedState(p => ({...p, category: null, index: 0})); setIsGuidedMode(true); setIsReviewing(false);}}>
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
          <button onClick={() => setActiveTab('ACCOUNT')} className="bg-white text-black text-[10px] font-black px-8 py-3 rounded-full uppercase">Upgrade</button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-10" />
            <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-xs">Mastermind Syncing...</p>
          </div>
        )}

        {activeTab === 'BUILD' && isGuidedMode && !guidedState.category && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in">
            <h2 className="text-[5vw] font-black italic uppercase text-white mb-20 tracking-tighter">Select Synthesis Vector</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl px-10">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button key={key} onClick={() => setGuidedState(p => ({ ...p, category: key, index: 0 }))} className="group glass rounded-[3rem] p-12 flex flex-col items-center transition-all hover:scale-105 shadow-2xl">
                  <flow.icon className="w-12 h-12 text-indigo-400 mb-8" />
                  <h3 className="text-xl font-black uppercase text-white italic">{flow.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'BUILD' && isGuidedMode && guidedState.category && (
          <div className="h-full flex flex-col p-16 overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="max-w-7xl mx-auto w-full space-y-12">
              {isReviewing ? (
                <div className="space-y-16 pb-32">
                   <h2 className="text-7xl font-black italic uppercase text-white">Strategy Room</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {mastermindSuggestions.map((cat, i) => (
                        <div key={i} className="glass p-12 rounded-[4rem] space-y-8 shadow-2xl">
                          <h4 className="text-[13px] font-black uppercase text-indigo-400 italic">{cat.category}</h4>
                          <div className="flex flex-col gap-3">
                             {cat.options.map((opt, j) => (
                               <button key={j} onClick={() => selectMastermindOption(cat.category, opt.technical_value)} className={`p-6 rounded-3xl text-left border transition-all ${selectedSuggestions[cat.category] === opt.technical_value ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}>
                                  <span className="text-[12px] font-black uppercase block">{opt.label}</span>
                                  <p className="text-[10px] opacity-60 uppercase mt-1">{opt.description}</p>
                               </button>
                             ))}
                          </div>
                        </div>
                      ))}
                   </div>
                   <button onClick={handleExecute} className="w-full py-12 bg-indigo-600 text-white font-black uppercase rounded-full shadow-2xl hover:bg-indigo-500 tracking-[0.5em] italic">Synthesize Final Masterwork</button>
                </div>
              ) : (
                <div className="space-y-12 pb-32">
                  {(() => {
                    const flow = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS];
                    const q = flow.questions[guidedState.index];
                    const options = (SHARDS as any)[q.key] || [];
                    return (
                      <>
                        <div className="max-w-5xl mx-auto p-10 glass rounded-[3rem] flex gap-10 shadow-inner border-indigo-500/20">
                          <Icons.Cpu className="w-12 h-12 text-indigo-400 flex-shrink-0" />
                          <p className="text-xl text-slate-300 font-semibold italic">"{getCoachingInsight(guidedState.category || '', guidedState.index)}"</p>
                        </div>
                        <h2 className="text-[5.5vw] font-black italic uppercase text-white text-center tracking-tighter">{q.label}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-10">
                          {options.map((opt: string) => {
                            const isSelected = ((form as any)[q.key] || "").split(', ').includes(opt);
                            return (
                              <button key={opt} onClick={() => toggleShard(q.key, opt)} className={`p-10 rounded-[2.5rem] font-black uppercase border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white scale-105 shadow-2xl' : 'bg-[#11141d] border-white/5 text-slate-500 hover:text-slate-300'}`}>{opt}</button>
                            );
                          })}
                        </div>
                        <div className="flex flex-col items-center pt-20">
                           <button onClick={guidedState.index < flow.questions.length - 1 ? () => setGuidedState(p => ({ ...p, index: p.index + 1 })) : handleAnalyzeMatrix} className="px-36 py-10 bg-white text-black font-black uppercase rounded-full shadow-2xl tracking-[0.5em] italic">
                             {guidedState.index < flow.questions.length - 1 ? 'Next Phase' : 'Mastermind Analysis'}
                           </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'BUILD' && output && (
           <main className="absolute inset-0 z-50 p-20 overflow-y-auto custom-scrollbar bg-[#050608] animate-fade-in">
               <div className="max-w-7xl mx-auto pb-48 space-y-40">
                   <div className="flex justify-between items-center border-b border-white/10 pb-12">
                      <h3 className="text-8xl font-black italic uppercase text-white tracking-tighter">Masterwork</h3>
                      <button onClick={() => handleCopyText(output.FINAL_PROMPT)} className="px-16 py-6 bg-white text-black font-black uppercase text-[12px] rounded-full shadow-2xl tracking-[0.3em] italic">Copy Logic</button>
                   </div>
                   <div className="bg-[#0e0f14] border border-white/5 p-24 rounded-[5.5rem] text-slate-300 font-mono text-2xl leading-relaxed whitespace-pre-wrap">
                      {output.FINAL_PROMPT}
                   </div>
                   {generatedVisual && (
                     <img src={generatedVisual} className="w-full rounded-[6rem] shadow-2xl" alt="Visual Synthesis" />
                   )}
                   <button onClick={() => setOutput(null)} className="text-slate-500 font-black uppercase tracking-widest italic">New Synthesis</button>
               </div>
           </main>
        )}

        {activeTab === 'HISTORY' && (
           <div className="h-full p-24 overflow-y-auto custom-scrollbar animate-fade-in">
             <h2 className="text-8xl font-black italic text-white mb-20">Archives</h2>
             {history.length === 0 ? <p className="text-slate-800 uppercase tracking-[1em] text-center py-56">Archives Standby...</p> : (
               <div className="grid grid-cols-1 gap-10 max-w-6xl mx-auto">
                 {history.map(item => (
                   <div key={item.id} className="glass p-16 rounded-[5rem] flex justify-between items-center group cursor-pointer" onClick={() => setOutput(item.output)}>
                     <h4 className="text-4xl font-black text-white italic group-hover:text-indigo-400 transition-colors uppercase">{item.input.high_level_goal.substring(0, 50)}...</h4>
                     <span className="text-indigo-500 font-black uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
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