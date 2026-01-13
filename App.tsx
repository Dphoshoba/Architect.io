import React, { useState, useEffect, useRef } from 'react';
import { PromptInput, PromptOutput, MarketingKit, TargetAI, UserStatus, HistoryItem } from './types';
import { TextArea, Select, TextInput } from './components/InputGroup';
import { 
  generateArchitectPrompt, 
  generateVisualImage, 
  generateMarketingKit
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
  Video: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  File: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  Camera: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
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
  img_subject: [
    "Futuristic Cityscape", "Organic Character", "Industrial Product", "Surreal Landscape", 
    "Minimalist Interior", "Hyper-realistic Portrait", "Cinematic Vehicle", "Botanical Hybrid",
    "Cosmic Nebula", "Cyberpunk Street", "Ancient Ruins", "Abstract Geometry",
    "Mythical Creature", "Macro Insect", "Underwater Kingdom", "Post-Apocalyptic Base",
    "Steampunk Machinery", "Ethereal Spirit", "Brutalist Structure", "Pop Art Illustration",
    "Isometric Diorama", "Neon City Lights", "Gothic Cathedral", "Glitch Art Figure",
    "Floating Islands", "Victorian Steampunk", "Mecha Unit", "Cybernetic Organism"
  ],
  img_lighting: ["Volumetric God-Rays", "Cyberpunk Neon", "Soft Golden Hour", "High-Contrast Studio", "Deep Oceanic Glow", "Cinematic Moonlight", "Flat Overcast Diffuse", "Bioluminescent Pulse"],
  img_composition: ["Rule of Thirds", "Extreme Low Angle", "Macro Detailed", "Bird's Eye View", "Symmetrical Balance", "Dynamic Dutch Angle", "Anamorphic Cinematic Wide", "High-Speed Freeze"],
  tone_style: ["Professional", "Concise", "Academic", "Creative", "Aggressive", "Empathetic", "Technical", "Instructional", "Socratic", "Philosophical"],
  task_type: ["Code Generation", "Strategic Synthesis", "Creative Writing", "Data Extraction", "Logical Reasoning", "Summarization", "Proofreading", "Transformation", "Audit", "Simulation"],
  output_format: [
    "Formatted Document (Markdown)", 
    "Data Sheet (JSON)", 
    "Plain Text Only", 
    "Structured Bullet Points", 
    "Professional Table", 
    "Technical Script (Code)", 
    "Config File (YAML)", 
    "Process Flow (Mermaid)", 
    "Blueprint Template", 
    "Email Draft"
  ],
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

// Base64 Helpers
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
    return () => stopLiveSession();
  }, []);

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
        alert("Architect Matrix: External media shard successfully synchronized.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyText = async (text: string) => {
    // Ensuring document is focused or handled through a direct promise
    try {
      if (!window.isSecureContext) {
        throw new Error("Clipboard API requires a secure context");
      }
      await navigator.clipboard.writeText(text);
      alert("Architect Shard successfully synchronized to clipboard.");
    } catch (err) {
      console.error("Clipboard Failure:", err);
      // Fallback for focus issue: sometimes prompt or alert helps re-focus if user interacts
      alert("Clipboard focus interrupted. Please ensure the window is active and try again.");
    }
  };

  const handleDownloadImage = () => {
    if (!generatedVisual) return;
    const link = document.createElement('a');
    link.href = generatedVisual;
    link.download = `ArchitectIO_Render_${Date.now()}.png`;
    link.click();
  };

  const handleDownloadPrompt = () => {
    if (!output?.FINAL_PROMPT) return;
    const blob = new Blob([output.FINAL_PROMPT], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prompt_Architect_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = output?.FINAL_PROMPT || "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Architect.io Synthesis Shard',
          text: text,
          url: window.location.href
        });
      } catch (e) {
        handleCopyText(text);
      }
    } else {
      handleCopyText(text);
    }
  };

  const handleExecute = async () => {
    if (!form.high_level_goal && Object.keys(guidedState.refinements).length === 0) return;
    setLoading(true);
    setGeneratedVisual(null);
    setOutput(null);
    setMarketingKit(null);

    try {
      const aggregatedContext = `
        PRIMARY DIRECTIVE: ${form.high_level_goal}
        ${Object.entries(guidedState.refinements)
          .map(([key, val]) => val ? `\n[${key.replace('img_', '').replace('web_', '').replace('prof_', '')} Matrix Shard]: ${val}` : '')
          .join('')}
      `;

      const res = await generateArchitectPrompt({ ...form, high_level_goal: aggregatedContext });
      setOutput(res);

      const quality = (form as any).visual_quality || 'Standard';
      const visualUrl = await generateVisualImage(
        res.VISUAL_INSPIRATION_PROMPT || aggregatedContext, 
        quality.includes('Imagen') ? 'imagen' : quality.includes('High') ? 'pro' : 'flash'
      );
      setGeneratedVisual(visualUrl);

      const kit = await generateMarketingKit(res.FINAL_PROMPT, aggregatedContext, form.language);
      setMarketingKit(kit);
      
      const newItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), input: { ...form, high_level_goal: aggregatedContext }, output: { ...res } };
      const updated = [newItem, ...history].slice(0, 50);
      setHistory(updated);
      localStorage.setItem('architect_history', JSON.stringify(updated));
      setUserStatus(p => ({ ...p, creditsRemaining: Math.max(0, p.creditsRemaining - 10) }));
    } catch (e: any) {
      console.error(e);
      alert("Synthesis matrix failed. Check connectivity.");
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
          systemInstruction: "You are the Architect.io Quantum Advisor. Synthesize logic prompts through multimodal voice session."
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (e) {
      setLoading(false);
      alert("Live protocol connection failed.");
    }
  };

  const stopLiveSession = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsLiveActive(false);
  };

  const SuggestionDropdown: React.FC<{ field: string; items: string[] }> = ({ field, items }) => {
    if (openDropdown !== field) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-[#11141d] border border-white/10 rounded-2xl z-[100] shadow-2xl grid grid-cols-2 gap-2 animate-fade-in">
        {items.map(item => {
          const isSelected = ((form as any)[field] || "").split(', ').includes(item);
          return (
            <button
              key={item}
              onClick={() => toggleShard(field, item)}
              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase text-left transition-all ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#050608] text-slate-100 overflow-hidden selection:bg-indigo-500/30">
      <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-[#050608]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-10">
          <div className="flex flex-col cursor-pointer" onClick={() => {setOutput(null); setGuidedState(p => ({...p, category: null, index: 0})); setIsGuidedMode(true);}}>
            <h1 className="text-2xl font-black italic tracking-tighter leading-none">ARCHITECT<span className="text-indigo-500">.IO</span></h1>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">Quantum Synthesis Protocol</p>
          </div>
          <nav className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {['BUILD', 'HISTORY', 'ACCOUNT'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {userStatus.creditsRemaining} Remaining
          </p>
          <button onClick={() => setActiveTab('ACCOUNT')} className="bg-white text-black text-[10px] font-black px-8 py-3.5 rounded-full uppercase hover:bg-slate-200 transition-all shadow-xl active:scale-95">Upgrade Phase</button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

        {loading && (
          <div className="absolute inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in text-center p-10">
            <div className="w-24 h-24 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin mb-10 shadow-[0_0_40px_rgba(79,70,229,0.5)]" />
            <p className="text-indigo-400 font-black uppercase tracking-[0.6em] text-sm animate-pulse italic">Synthesizing High-Fidelity Matrix...</p>
          </div>
        )}

        {/* GUIDED MODE HUB */}
        {activeTab === 'BUILD' && isGuidedMode && !guidedState.category && (
          <div className="h-full flex flex-col items-center justify-center px-10 relative overflow-hidden bg-[#050608]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] bg-indigo-600/5 rounded-full blur-[200px] pointer-events-none" />
            <div className="text-center mb-24 z-10 animate-fade-in">
              <h2 className="text-[6vw] font-black italic tracking-tighter uppercase leading-none text-white">Select Synthesis Vector</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl px-10 z-10">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button key={key} onClick={() => setGuidedState(p => ({ ...p, category: key, index: 0 }))} className="group relative h-[380px] glass rounded-[3.5rem] p-12 flex flex-col items-center justify-center transition-all duration-500 hover:border-indigo-500/50 hover:scale-[1.05] hover:shadow-2xl">
                  <div className="w-24 h-24 flex items-center justify-center bg-indigo-500/10 rounded-full mb-10 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-lg">
                    <flow.icon className="w-12 h-12 text-indigo-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-black tracking-[0.2em] uppercase text-white italic text-center leading-tight mb-2">{flow.title}</h3>
                  <div className="w-10 h-1 bg-white/5 rounded-full group-hover:bg-indigo-500 group-hover:w-20 transition-all duration-500" />
                </button>
              ))}
            </div>
            <button onClick={() => setIsGuidedMode(false)} className="mt-20 text-slate-600 font-black uppercase text-[11px] hover:text-indigo-400 transition-colors tracking-widest border-b border-white/5 pb-1 italic">Enter Manual Architect Mode</button>
          </div>
        )}

        {/* GUIDED MODE FLOW */}
        {activeTab === 'BUILD' && isGuidedMode && guidedState.category && (
          <div className="h-full flex overflow-hidden animate-fade-in bg-[#050608]">
            <div className="flex-1 flex flex-col p-16 overflow-y-auto custom-scrollbar relative">
              <button onClick={() => setGuidedState(p => ({ ...p, category: null, index: 0, refinements: {} }))} className="absolute top-16 left-16 flex items-center gap-3 text-[11px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-widest italic"><Icons.ArrowLeft className="w-4 h-4" /> Reset Evolution Matrix</button>
              
              <div className="max-w-7xl mx-auto w-full pt-20 space-y-24">
                {(() => {
                  const flow = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS];
                  
                  if (guidedState.category === 'Live') {
                    return (
                       <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-10">
                          <div className="text-center">
                            <h2 className="text-6xl font-black italic tracking-tighter uppercase text-white mb-4">Voice Protocol</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Real-time Multimodal Synthesis</p>
                          </div>
                          <div className="glass rounded-[3.5rem] p-12 h-[450px] overflow-y-auto custom-scrollbar space-y-4 shadow-2xl">
                             {liveTranscription.length === 0 && <p className="text-slate-800 font-black uppercase text-center py-24 tracking-widest opacity-20 italic">Voice Matrix Standby...</p>}
                             {liveTranscription.map((line, i) => (
                               <p key={i} className={`text-sm font-bold uppercase tracking-wide p-6 rounded-3xl ${line.startsWith('AI') ? 'bg-indigo-500/10 text-indigo-300 border-l-4 border-indigo-500 shadow-inner' : 'bg-white/5 text-slate-400'}`}>{line}</p>
                             ))}
                          </div>
                          <div className="flex justify-center pt-10">
                             {!isLiveActive ? (
                               <button onClick={startLiveSession} className="px-24 py-8 bg-indigo-600 text-white font-black uppercase tracking-[0.4em] rounded-full shadow-3xl hover:bg-indigo-500 hover:scale-105 transition-all text-xs">Initialize Live Matrix</button>
                             ) : (
                               <button onClick={stopLiveSession} className="px-24 py-8 bg-rose-600 text-white font-black uppercase tracking-[0.4em] rounded-full shadow-3xl hover:bg-rose-500 hover:scale-105 transition-all text-xs">Deactivate Link</button>
                             )}
                          </div>
                       </div>
                    );
                  }

                  const q = flow.questions[guidedState.index];
                  const options = q.key === 'aspect_ratio' ? ['16:9', '9:16', '1:1'] : 
                                 q.key === 'visual_quality' ? ['Standard 1K', 'High Pro 2K', 'Imagen 4 Ultra'] :
                                 (SHARDS as any)[q.key] || [];

                  return (
                    <div className="space-y-20 animate-fade-in pb-32">
                      <div className="text-center">
                        <span className="text-indigo-500 font-black uppercase tracking-[0.6em] mb-4 block italic text-xs">{guidedState.category} Synthesis Phase {guidedState.index + 1}/8</span>
                        <h2 className="text-[5.5vw] font-black italic tracking-tighter uppercase leading-none text-white selection:bg-indigo-500">{q.label}</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-10">
                        {options.map((opt: string) => {
                          const isSelected = ((form as any)[q.key] || "").split(', ').includes(opt);
                          return (
                            <button 
                              key={opt} 
                              onClick={() => toggleShard(q.key, opt)} 
                              className={`p-10 rounded-[2.5rem] text-[13px] font-black uppercase text-center border transition-all duration-300 shadow-xl relative overflow-hidden group ${
                                isSelected 
                                ? 'bg-indigo-600 border-indigo-400 text-white scale-[1.05] shadow-[0_0_30px_rgba(79,70,229,0.4)]' 
                                : 'bg-[#11141d]/80 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                              }`}
                            >
                              {opt}
                              <div className={`absolute top-0 left-0 w-full h-1 bg-white/20 transition-transform duration-500 origin-left ${isSelected ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100 opacity-20'}`} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Multimodal & Refinement Input */}
                      <div className="w-full max-w-5xl mx-auto space-y-12 mt-12 bg-white/5 p-12 rounded-[4.5rem] border border-white/5 shadow-inner">
                        <div className="relative group">
                          <TextInput 
                            label={`Manual Synthesis for ${q.label}`}
                            placeholder={`Enter specific overrides or details...`}
                            value={guidedState.refinements[q.key] || ""}
                            onChange={(e) => updateRefinement(q.key, e.target.value)}
                            className="bg-[#050608]/50 border-white/10 text-lg py-10 px-12 rounded-[3.5rem] focus:ring-indigo-500/40"
                          />
                          <div className="absolute right-8 bottom-6 flex gap-6 items-center">
                             <button onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-indigo-400 transition-colors" title="Upload Media Reference Shard"><Icons.Photo className="w-8 h-8" /></button>
                             <button onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-indigo-400 transition-colors" title="Upload Document Logic Shard"><Icons.File className="w-8 h-8" /></button>
                             <button className="text-slate-500 hover:text-indigo-400 transition-colors" title="Voice Matrix Transcription"><Icons.Mic className="w-8 h-8" /></button>
                             <button className="text-slate-500 hover:text-indigo-400 transition-colors" title="Video Reference Link"><Icons.Video className="w-8 h-8" /></button>
                             <button className="text-slate-500 hover:text-indigo-400 transition-colors" title="Camera Evolution Link"><Icons.Camera className="w-8 h-8" /></button>
                          </div>
                        </div>
                        {form.media_ref_base64 && (
                          <div className="mt-8 flex items-center gap-8 animate-fade-in p-8 bg-white/5 rounded-[3rem] border border-white/10 group">
                             <img src={form.media_ref_base64} className="w-32 h-32 object-cover rounded-3xl shadow-2xl group-hover:scale-105 transition-transform" />
                             <div>
                               <p className="text-[11px] font-black uppercase text-emerald-400 italic tracking-widest leading-none">Visual Reference Shard Synchronized</p>
                               <button onClick={() => setForm(p => ({...p, media_ref_base64: undefined}))} className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-3 hover:text-rose-300 flex items-center gap-2 italic"><Icons.Trash className="w-4 h-4" /> Purge Matrix Shard</button>
                             </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-12 pt-16">
                        {guidedState.index < flow.questions.length - 1 ? (
                          <button 
                            onClick={() => setGuidedState(p => ({ ...p, index: p.index + 1 }))} 
                            className="px-36 py-10 bg-white text-black font-black uppercase text-[12px] rounded-full shadow-3xl hover:scale-105 transition-all tracking-[0.6em] active:scale-95 italic"
                          >
                            Proceed Matrix
                          </button>
                        ) : (
                          <div className="w-full max-w-3xl space-y-12">
                            <TextArea 
                              label="Core Project Goal (Positive Matrix)" 
                              value={form.high_level_goal} 
                              onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} 
                              placeholder="Describe the desired synthesis outcome..." 
                              className="bg-white/5 border-white/10 text-xl py-10 px-12 rounded-[4.5rem] min-h-[180px]" 
                            />
                            <TextArea 
                              label="Avoidance Constraints (Negative Matrix)" 
                              value={form.negative_prompt} 
                              onChange={e => setForm(p => ({ ...p, negative_prompt: e.target.value }))} 
                              placeholder="Describe what the AI should avoid..." 
                              className="bg-[#1a1c24]/50 border-white/5 text-lg py-10 px-12 rounded-[4.5rem] min-h-[140px]" 
                            />
                            <button 
                              onClick={handleExecute} 
                              disabled={!form.high_level_goal && Object.keys(guidedState.refinements).length === 0} 
                              className="w-full py-12 bg-indigo-600 text-white font-black uppercase text-sm rounded-full shadow-[0_0_60px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all tracking-[0.7em] active:scale-95 italic"
                            >
                              Initialize Full Synthesis
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* MANUAL ARCHITECT MATRIX SIDEBAR */}
        {activeTab === 'BUILD' && !isGuidedMode && (
          <div className="h-full flex animate-fade-in bg-[#050608]">
             <aside className="w-[560px] border-r border-white/5 bg-[#08090b] p-12 overflow-y-auto custom-scrollbar space-y-10 flex-shrink-0" onClick={() => setOpenDropdown(null)}>
               
               {/* Back to Guided Hub */}
               <button onClick={() => {setIsGuidedMode(true); setGuidedState(p => ({...p, category: null}));}} className="flex items-center gap-3 text-[11px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.3em] italic mb-6 group">
                 <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Vector Matrix
               </button>

               <div className="flex items-center gap-5 text-indigo-500 mb-2">
                 <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                   <Icons.Robot className="w-10 h-10" /> 
                 </div>
                 <div>
                   <h4 className="text-[13px] font-black uppercase tracking-[0.6em] italic leading-tight">QUANTUM ARCHITECT</h4>
                   <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Manual Protocol Synthesis</p>
                 </div>
               </div>

               <div className="space-y-8">
                 <div className="relative group">
                    <TextArea 
                      label="Synthesis Directive (Core Objective)" 
                      value={form.high_level_goal} 
                      onChange={e => setForm(p => ({ ...p, high_level_goal: e.target.value }))} 
                      placeholder="Core project objective shard..." 
                      className="min-h-[180px] text-lg font-medium pr-16 pt-10 rounded-[3.5rem]" 
                    />
                    <div className="absolute right-5 bottom-5 flex flex-col gap-4">
                       <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-400 transition-all hover:bg-white/10 shadow-lg" title="Link Media Reference Matrix"><Icons.Photo className="w-6 h-6" /></button>
                       <button className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-400 transition-all hover:bg-white/10 shadow-lg" title="Voice Link Shard"><Icons.Mic className="w-6 h-6" /></button>
                    </div>
                 </div>

                 <TextArea 
                   label="Avoidance Shards (Negative Constraints)" 
                   value={form.negative_prompt} 
                   onChange={e => setForm(p => ({ ...p, negative_prompt: e.target.value }))} 
                   placeholder="Prohibited patterns/styles..." 
                   className="min-h-[110px] text-md rounded-[3.5rem]" 
                 />
               </div>

               {form.media_ref_base64 && (
                 <div className="flex items-center gap-5 p-5 bg-white/5 border border-white/5 rounded-[2.5rem] shadow-inner animate-fade-in group">
                   <img src={form.media_ref_base64} className="w-16 h-16 object-cover rounded-2xl shadow-xl group-hover:scale-105 transition-transform" />
                   <div className="flex-1 overflow-hidden">
                     <p className="text-[10px] font-black text-emerald-400 uppercase italic tracking-widest">Media Matrix Reference Loaded</p>
                     <button onClick={() => setForm(p => ({...p, media_ref_base64: undefined}))} className="text-rose-500 text-[9px] font-bold uppercase mt-1 tracking-widest italic flex items-center gap-1"><Icons.Trash className="w-3 h-3" /> Purge Reference</button>
                   </div>
                 </div>
               )}
               
               <div className="space-y-6 pt-4 border-t border-white/5">
                  <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic pb-2">Synthesis Context Shards</h5>
                  {['web_type', 'prof_domain', 'img_subject', 'web_aesthetic', 'tone_style', 'task_type', 'output_format'].map(key => (
                    <div key={key} className="relative" onClick={e => e.stopPropagation()}>
                       <button onClick={() => setOpenDropdown(openDropdown === key ? null : key)} className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl text-left text-[11px] font-black text-slate-400 flex justify-between items-center transition-all hover:border-white/10 uppercase tracking-widest group italic">
                         {key.replace('web_', '').replace('prof_', '').replace('img_', '').replace('_', ' ')}
                         <Icons.ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === key ? 'rotate-180 text-indigo-400' : 'group-hover:text-slate-300'}`} />
                       </button>
                       <SuggestionDropdown field={key} items={(SHARDS as any)[key]} />
                       { (form as any)[key] && (
                         <div className="mt-2 text-[10px] font-black text-indigo-400 italic px-4 truncate">{(form as any)[key]}</div>
                       )}
                    </div>
                  ))}
               </div>

               <div className="grid grid-cols-2 gap-5">
                  <Select label="Model Grid" value={form.target_AI} onChange={e => setForm(p => ({ ...p, target_AI: e.target.value as any }))}>
                    {TARGET_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
                  <Select label="Matrix Reasoning" value={form.reasoning_visibility} onChange={e => setForm(p => ({ ...p, reasoning_visibility: e.target.value as any }))}>
                    <option value="brief">Brief Shard</option>
                    <option value="detailed">Deep Shard</option>
                    <option value="hidden">Stealth Mode</option>
                  </Select>
               </div>

               <button onClick={handleExecute} disabled={!form.high_level_goal} className="w-full py-11 bg-indigo-600 text-white font-black uppercase tracking-[0.7em] rounded-full shadow-[0_0_50px_rgba(79,70,229,0.3)] hover:bg-indigo-500 active:scale-95 transition-all text-xs mt-8 italic">Synthesize Full Matrix</button>
             </aside>

             <main className="flex-1 bg-[#050608] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] select-none pointer-events-none flex items-center justify-center">
                   <h1 className="text-[14vw] font-black italic uppercase leading-none tracking-tighter text-center">AWAITING<br/>QUANTUM<br/>SEED</h1>
                </div>
                <div className="text-center z-10 space-y-8 animate-fade-in">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                    <Icons.Sparkles className="w-12 h-12 text-slate-800 animate-pulse" />
                  </div>
                  <p className="text-slate-700 font-black uppercase tracking-[1.2em] text-[11px] italic">Terminal Ready for Manual Matrix Definition...</p>
                </div>
             </main>
          </div>
        )}

        {/* OUTPUT SCREEN */}
        {activeTab === 'BUILD' && (output || loading) && (
           <main className="absolute inset-0 z-50 p-20 overflow-y-auto custom-scrollbar bg-[#050608] animate-fade-in">
               <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-indigo-600/5 rounded-full blur-[200px] pointer-events-none" />
               <div className="max-w-7xl mx-auto pb-48">
                   <div className="flex justify-between items-center mb-10">
                     <button onClick={() => { setOutput(null); setGuidedState(p => ({ ...p, category: null, index: 0, refinements: {} })); }} className="flex items-center gap-3 text-[11px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest italic group"><Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Reset Architect Protocol</button>
                     <div className="flex gap-4">
                        <button onClick={handleShare} className="p-5 bg-white/5 rounded-full text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all shadow-xl" title="Share Complete Synthesis"><Icons.Share className="w-7 h-7" /></button>
                        <button onClick={handleDownloadPrompt} className="p-5 bg-white/5 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-all shadow-xl" title="Export Prompt Source Shard"><Icons.Download className="w-7 h-7" /></button>
                     </div>
                   </div>

                   {output && (
                     <div className="space-y-40">
                        <div className="space-y-16">
                            <div className="flex justify-between items-end border-b border-white/10 pb-12">
                              <div>
                                <h3 className="text-8xl font-black italic tracking-tighter uppercase leading-none text-white selection:bg-indigo-500">Synthesized Shard</h3>
                                <p className="text-indigo-500 font-bold uppercase tracking-[0.6em] mt-6 text-xs italic">RAIC Master Logic Core Definition</p>
                              </div>
                              <button onClick={() => handleCopyText(output.FINAL_PROMPT)} className="group flex items-center gap-5 px-16 py-6 bg-white text-black font-black uppercase text-[12px] rounded-full hover:bg-slate-200 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 tracking-[0.3em] italic"><Icons.Copy className="w-6 h-6" /> Copy Synthesis Shard</button>
                            </div>
                            <div className="bg-[#0e0f14] border border-white/5 p-24 rounded-[5.5rem] text-slate-300 font-mono text-2xl leading-relaxed relative overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.6)] whitespace-pre-wrap selection:bg-indigo-500/50">
                              <div className="absolute top-0 right-0 p-16 text-white/5 pointer-events-none uppercase font-black tracking-[1.5em] text-8xl transform rotate-90 origin-top-right select-none">QUANTUM</div>
                              {output.FINAL_PROMPT}
                            </div>
                        </div>

                        {generatedVisual && (
                          <div className="space-y-16 animate-fade-in relative group">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[16px] font-black uppercase text-indigo-500 tracking-[1.2em] italic border-l-4 border-indigo-600 pl-10">VISUAL MATRIX CORE</h4>
                              <button onClick={handleDownloadImage} className="flex items-center gap-4 px-10 py-5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-black uppercase text-[11px] tracking-[0.4em] hover:bg-emerald-500 hover:text-white transition-all shadow-2xl italic"><Icons.Download className="w-5 h-5" /> Download 2K Master</button>
                            </div>
                            <img src={generatedVisual} className="w-full rounded-[6.5rem] border border-white/10 shadow-[0_0_180px_rgba(0,0,0,0.8)] group-hover:scale-[1.01] transition-transform duration-1000" alt="Synthesis Visual Render" />
                          </div>
                        )}

                        {marketingKit && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-10 animate-fade-in">
                              {Object.entries(marketingKit).map(([k, v], i) => (
                                <div key={i} className="glass p-16 rounded-[5.5rem] border-white/5 space-y-10 hover:border-indigo-500/30 transition-all shadow-[0_0_80px_rgba(0,0,0,0.4)] group relative overflow-hidden">
                                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
                                   <h5 className="text-[12px] font-black uppercase text-indigo-500 tracking-[0.5em] group-hover:text-white transition-colors uppercase italic">{k.replace('_', ' ')}</h5>
                                   <p className="text-[16px] text-slate-400 leading-relaxed font-medium group-hover:text-slate-200 transition-colors italic">{v}</p>
                                </div>
                              ))}
                           </div>
                        )}
                     </div>
                   )}
               </div>
           </main>
        )}

        {/* HISTORY & ACCOUNT */}
        {activeTab === 'HISTORY' && (
           <div className="h-full p-24 animate-fade-in overflow-y-auto custom-scrollbar bg-[#050608]">
             <div className="max-w-6xl mx-auto space-y-20">
               <div className="flex justify-between items-end border-b border-white/5 pb-14">
                  <h2 className="text-8xl font-black italic tracking-tighter uppercase text-white">Archives</h2>
                  {history.length > 0 && <button onClick={() => { setHistory([]); localStorage.removeItem('architect_history'); }} className="text-rose-500 font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:text-rose-400 transition-colors italic group"><Icons.Trash className="w-5 h-5 group-hover:scale-110 transition-transform" /> Purge Matrix Records</button>}
               </div>
               {history.length === 0 ? <p className="text-slate-800 font-black uppercase tracking-[1.5em] text-center py-56 opacity-20 text-sm italic">Archives Sync Standby...</p> : (
                 <div className="grid grid-cols-1 gap-12">
                   {history.map(item => (
                     <div key={item.id} className="glass p-16 rounded-[5.5rem] border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group flex justify-between items-center" onClick={() => { setOutput(item.output); setForm(item.input); setActiveTab('BUILD'); setIsGuidedMode(false); }}>
                       <div className="space-y-6">
                          <span className="text-indigo-500 font-black text-[11px] uppercase tracking-widest italic">{new Date(item.timestamp).toLocaleString()}</span>
                          <h4 className="text-5xl font-black italic text-white uppercase group-hover:text-indigo-400 transition-colors tracking-tighter leading-tight">{item.input.high_level_goal.split('\n')[0].substring(0, 80)}...</h4>
                       </div>
                       <div className="bg-white/5 px-12 py-5 rounded-full text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all italic shadow-lg">{item.input.target_AI}</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'ACCOUNT' && (
          <div className="h-full p-24 animate-fade-in overflow-y-auto custom-scrollbar bg-[#050608]">
            <div className="max-w-4xl mx-auto space-y-24">
              <h2 className="text-8xl font-black italic tracking-tighter uppercase text-white leading-none">Neural Energy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="glass p-16 rounded-[5.5rem] border-white/5 space-y-8 shadow-2xl">
                  <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic">Operational Phase</p>
                  <p className="text-6xl font-black uppercase italic text-indigo-400 tracking-tighter leading-none">{userStatus.plan}</p>
                </div>
                <div className="glass p-16 rounded-[5.5rem] border-white/5 space-y-8 shadow-2xl">
                  <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic">Matrix Unit Balance</p>
                  <p className="text-6xl font-black uppercase italic text-emerald-400 tracking-tighter leading-none">{userStatus.creditsRemaining} Units</p>
                </div>
              </div>
              <div className="glass p-20 rounded-[6.5rem] border-indigo-500/20 bg-indigo-500/5 space-y-12 shadow-[0_0_100px_rgba(79,70,229,0.15)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
                <div className="space-y-10 relative z-10">
                   <h3 className="text-6xl font-black italic uppercase text-white tracking-tighter leading-none">Authorize Evolution</h3>
                   <p className="text-slate-400 text-2xl leading-relaxed max-w-2xl font-medium italic">Gain access to 4K Visual Synthesis, ultra-fidelity video generation, and priority Gemini 3 Pro reasoning. Synchronize your team on the global quantum grid.</p>
                </div>
                <button className="w-full py-12 bg-white text-black font-black uppercase tracking-[1em] rounded-full shadow-[0_0_70px_rgba(255,255,255,0.2)] hover:bg-slate-200 transition-all text-sm active:scale-95 relative z-10 italic">Authorize Phase Expansion - $29/mo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;