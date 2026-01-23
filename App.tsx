
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
  Copy: (props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
};

const GUIDED_FLOWS = {
  'Engineering': { title: 'ENGINEERING', icon: Icons.Cpu, questions: [{ key: 'eng_field', label: 'Technical Domain' }, { key: 'high_level_goal', label: 'System Objective' }] },
  'Real Estate': { title: 'REAL ESTATE', icon: Icons.Home, questions: [{ key: 'estate_style', label: 'Aesthetic DNA' }, { key: 'high_level_goal', label: 'Spatial Vision' }] },
  'Artist': { title: 'ARTIST', icon: Icons.Palette, questions: [{ key: 'artist_medium', label: 'Primary Medium' }, { key: 'high_level_goal', label: 'Conceptual Goal' }] },
  'Image': { title: 'IMAGE', icon: Icons.Photo, questions: [{ key: 'img_lighting', label: 'Lighting Rig' }, { key: 'high_level_goal', label: 'Visual Intent' }] },
  'Video': { title: 'VIDEO', icon: Icons.Video, questions: [{ key: 'vid_style', label: 'Motion Style' }, { key: 'high_level_goal', label: 'Narrative Arc' }] },
  'Website': { title: 'WEBSITE', icon: Icons.Globe, questions: [{ key: 'web_type', label: 'Platform Type' }, { key: 'high_level_goal', label: 'Vision' }] },
  'Live': { title: 'LIVE VOICE', icon: Icons.Mic, questions: [] }
};

const SHARDS = {
  eng_field: [{ label: "Software Systems", desc: "Architecture & Scale" }, { label: "Mechanical", desc: "Hardware & Motion" }, { label: "AI Engineering", desc: "LLMs & Data flows" }],
  estate_style: [{ label: "Minimalist Modern", desc: "Clean lines, Open flow" }, { label: "Industrial Loft", desc: "Metal, Brick, Raw" }, { label: "Mid-Century", desc: "Classic Organic" }],
  artist_medium: [{ label: "Digital Concept Art", desc: "World-building" }, { label: "Oil Painting", desc: "Texture & Depth" }, { label: "Abstract Sculpture", desc: "3D Form" }],
  img_lighting: [{ label: "Cinematic", desc: "High Contrast" }, { label: "Golden Hour", desc: "Warm & Soft" }, { label: "Studio Neon", desc: "Vibrant Cyber" }],
  vid_style: [{ label: "3D Rendered", desc: "Cinematic Motion" }, { label: "Hand-Drawn", desc: "Fluid Animation" }, { label: "Drone Aerial", desc: "Sweeping Views" }],
  web_type: [{ label: "Luxury Brand", desc: "Visual-First" }, { label: "SaaS Landing", desc: "Conversion-Led" }, { label: "Creative Portfolio", desc: "Asset-Heavy" }]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUILD' | 'HISTORY'>('BUILD');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [guidedState, setGuidedState] = useState({ category: null as string | null, index: 0 });
  const [form, setForm] = useState<PromptInput>({
    target_AI: "Gemini 3 Flash", high_level_goal: "", task_type: "Synthesis", domain_context: "",
    user_persona: "Lead Architect", tone_style: "Professional", output_format: "Markdown",
    length_and_depth: "Detailed", reasoning_visibility: "detailed", language: "English",
    visual_inspiration_mode: true
  });
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [mastermindSuggestions, setMastermindSuggestions] = useState<MastermindSuggestionCategory[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('architect_mobbin_v2');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleStartFlow = async () => {
    setLoading(true);
    try {
      const res = await generateInterviewQuestions(form);
      setInterviewQuestions(res);
      setIsInterviewing(true);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAnalyzeMatrix = async () => {
    setLoading(true);
    try {
      const refinedGoal = `${form.high_level_goal} ${Object.values(interviewAnswers).join(' ')}`;
      const res = await generateMastermindSuggestions({ ...form, high_level_goal: refinedGoal });
      setMastermindSuggestions(res);
      setIsReviewing(true);
      setIsInterviewing(false);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSynthesize = async () => {
    setLoading(true);
    try {
      const finalGoal = `OBJECTIVE: ${form.high_level_goal}\nREFINEMENTS: ${Object.values(selectedSuggestions).join(', ')}`;
      const res = await generateArchitectPrompt({ ...form, high_level_goal: finalGoal });
      setOutput(res);
      const img = await generateVisualImage(res.VISUAL_INSPIRATION_PROMPT || finalGoal);
      setGeneratedVisual(img);
      const newItem = { id: Date.now().toString(), timestamp: Date.now(), input: { ...form }, output: { ...res } };
      const newHist = [newItem, ...history];
      setHistory(newHist);
      localStorage.setItem('architect_mobbin_v2', JSON.stringify(newHist));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-8 glass-header fixed top-0 w-full z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setOutput(null); setGuidedState({ category: null, index: 0 }); setIsReviewing(false); setIsInterviewing(false); }}>
            <div className="w-8 h-8 bg-[#141414] rounded-lg flex items-center justify-center text-white font-black">M</div>
            <h1 className="text-xl font-black uppercase tracking-tighter">ARCHITECT<span className="text-[#0055FF]">.IO</span></h1>
          </div>
          <nav className="flex gap-6">
            {['BUILD', 'HISTORY'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`text-xs font-bold tracking-widest ${activeTab === tab ? 'text-[#141414] border-b-2 border-[#141414]' : 'text-slate-400'}`}>{tab}</button>
            ))}
          </nav>
        </div>
        <button className="mobbin-btn-primary text-xs">Join for free</button>
      </header>

      <div className="flex-1 mt-16 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/90 flex flex-col items-center justify-center backdrop-blur-xl">
            <div className="w-10 h-10 border-2 border-[#141414] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-[10px] uppercase tracking-widest">Synthesizing Architecture...</p>
          </div>
        )}

        {/* VECTOR SELECTION */}
        {activeTab === 'BUILD' && !guidedState.category && !output && (
          <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="text-center mb-16">
              <h2 className="text-[5vw] mb-4">Discovery Vector.</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Select a specialized engine to begin your synthesis. Precision-built for high-end production.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 w-full max-w-6xl">
              {Object.entries(GUIDED_FLOWS).map(([key, flow]) => (
                <button key={key} onClick={() => setGuidedState({ category: key, index: 0 })} className="group mobbin-card p-6 flex flex-col items-center text-center">
                  <flow.icon className="w-8 h-8 text-[#0055FF] mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-[10px] uppercase tracking-widest">{flow.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GUIDED FLOWS */}
        {activeTab === 'BUILD' && guidedState.category && !isInterviewing && !isReviewing && !output && (
          <div className="h-full flex flex-col p-12 overflow-y-auto custom-scrollbar bg-white">
            <div className="max-w-6xl mx-auto w-full space-y-12">
              <button onClick={() => setGuidedState({ category: null, index: 0 })} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest italic hover:text-black">
                <Icons.ArrowLeft className="w-4 h-4" /> Back to vectors
              </button>
              <div className="text-center space-y-4">
                <h2 className="text-[6vw]">{GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index]?.label}</h2>
              </div>
              {(() => {
                const q = GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions[guidedState.index];
                if (!q) return null;
                const options = (SHARDS as any)[q.key] || [];
                return q.key === 'high_level_goal' ? (
                  <TextArea value={(form as any)[q.key] || ""} onChange={e => setForm(p => ({ ...p, [q.key]: e.target.value }))} className="max-w-4xl mx-auto mobbin-input text-xl py-8 min-h-[300px]" placeholder="Architectural vision..." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {options.map((opt: any) => (
                      <button key={opt.label} onClick={() => setForm(p => ({ ...p, [q.key]: opt.label }))} className={`p-8 mobbin-card transition-all flex flex-col items-center gap-2 ${(form as any)[q.key] === opt.label ? 'bg-[#141414] text-white' : 'text-slate-600'}`}>
                        <span className="text-[12px] font-black uppercase">{opt.label}</span>
                        <span className="text-[8px] uppercase opacity-50">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
              <div className="flex justify-center pt-16">
                 <button onClick={() => {
                   if (guidedState.index < GUIDED_FLOWS[guidedState.category as keyof typeof GUIDED_FLOWS].questions.length - 1) setGuidedState(p => ({ ...p, index: p.index + 1 }));
                   else handleStartFlow();
                 }} className="mobbin-btn-primary px-32 uppercase italic tracking-[0.4em] text-xs">Proceed</button>
              </div>
            </div>
          </div>
        )}

        {/* INTERVIEW CLARIFICATION */}
        {activeTab === 'BUILD' && isInterviewing && (
           <div className="h-full p-16 overflow-y-auto bg-white">
              <div className="max-w-3xl mx-auto space-y-12 pb-32">
                 <div className="text-center">
                   <h2 className="text-5xl">Probe Phase.</h2>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Clarifying logical dependencies</p>
                 </div>
                 {interviewQuestions.map(q => (
                    <div key={q.id} className="mobbin-card p-10 space-y-6">
                       <h4 className="text-lg font-bold italic">{q.question}</h4>
                       <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black italic">{q.context}</p>
                       <TextArea value={interviewAnswers[q.id] || ""} onChange={e => setInterviewAnswers(p => ({ ...p, [q.id]: e.target.value }))} className="mobbin-input" placeholder="Logic detail..." />
                    </div>
                 ))}
                 <button onClick={handleAnalyzeMatrix} className="mobbin-btn-primary w-full py-6 uppercase tracking-[0.4em] text-xs">Initialize Matrix</button>
              </div>
           </div>
        )}

        {/* STRATEGY ROOM */}
        {activeTab === 'BUILD' && isReviewing && (
          <div className="h-full p-16 overflow-y-auto bg-white">
            <div className="max-w-6xl mx-auto space-y-16 pb-32">
               <div className="text-center">
                 <h2 className="text-7xl">Strategy Room.</h2>
                 <p className="text-[#0055FF] font-black uppercase tracking-[0.4em] text-[10px] mt-4">Select final architectural refinements</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {mastermindSuggestions.map((cat, i) => (
                    <div key={i} className="mobbin-card p-8 space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-[#0055FF] tracking-widest italic">{cat.category}</h4>
                      <div className="flex flex-col gap-3">
                         {cat.options.map((opt, j) => (
                           <button key={j} onClick={() => setSelectedSuggestions(p => ({ ...p, [cat.category]: opt.technical_value }))} className={`p-6 rounded-xl text-left border transition-all ${selectedSuggestions[cat.category] === opt.technical_value ? 'bg-[#141414] text-white' : 'bg-white text-slate-500'}`}>
                              <span className="text-[11px] font-black uppercase">{opt.label}</span>
                              <p className="text-[9px] opacity-60 uppercase mt-2">{opt.description}</p>
                           </button>
                         ))}
                      </div>
                    </div>
                  ))}
               </div>
               <button onClick={handleSynthesize} className="mobbin-btn-primary w-full py-8 text-sm uppercase tracking-[1em] italic">Synthesize Blueprint</button>
            </div>
          </div>
        )}

        {/* FINAL OUTPUT */}
        {activeTab === 'BUILD' && output && (
           <main className="absolute inset-0 z-[200] p-12 overflow-y-auto bg-white animate-fade-in custom-scrollbar">
               <div className="max-w-6xl mx-auto pb-48 space-y-24">
                   <div className="flex justify-between items-end border-b-2 border-black/5 pb-10">
                      <div>
                        <h3 className="text-8xl">BLUEPRINT.</h3>
                        <p className="text-[#0055FF] font-black uppercase tracking-[0.2em] text-[10px] mt-4">Integrity Verified</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => navigator.clipboard.writeText(output.FINAL_PROMPT)} className="mobbin-btn-primary flex items-center gap-2 uppercase text-xs tracking-widest"><Icons.Copy className="w-4 h-4" /> Copy Spec</button>
                        <button onClick={() => setOutput(null)} className="mobbin-btn-secondary uppercase text-xs tracking-widest">New Vector</button>
                      </div>
                   </div>
                   {output.APP_BLUEPRINT && (
                     <div className="space-y-6">
                        <h4 className="text-[#0055FF] text-[10px] font-black tracking-[0.5em] uppercase">01. Architecture</h4>
                        <div className="mobbin-card p-16 text-[#141414] text-xl leading-relaxed whitespace-pre-wrap">{output.APP_BLUEPRINT}</div>
                     </div>
                   )}
                   <div className="space-y-6">
                      <h4 className="text-[#0055FF] text-[10px] font-black tracking-[0.5em] uppercase">02. Expert Prompt</h4>
                      <div className="bg-[#f8f9fa] border border-black/5 p-16 rounded-[2rem] text-slate-600 font-mono leading-relaxed whitespace-pre-wrap">{output.FINAL_PROMPT}</div>
                   </div>
                   {generatedVisual && (
                     <div className="space-y-6">
                        <h4 className="text-[#0055FF] text-[10px] font-black tracking-[0.5em] uppercase">03. Rendering</h4>
                        <img src={generatedVisual} className="w-full rounded-[3rem] shadow-2xl" alt="Viz Render" />
                     </div>
                   )}
               </div>
           </main>
        )}

        {/* HISTORY */}
        {activeTab === 'HISTORY' && (
           <div className="h-full p-20 overflow-y-auto bg-white custom-scrollbar">
             <div className="max-w-5xl mx-auto">
               <h2 className="text-7xl mb-16">Archives.</h2>
               {history.length === 0 ? <p className="text-slate-300 tracking-widest text-center py-40 font-black uppercase">Neutral Storage...</p> : (
                 <div className="grid grid-cols-1 gap-6">
                   {history.map(item => (
                     <div key={item.id} className="mobbin-card p-10 flex justify-between items-center cursor-pointer group" onClick={() => { setOutput(item.output); setActiveTab('BUILD'); }}>
                       <div className="space-y-2">
                          <span className="text-[#0055FF] font-black uppercase text-[9px]">{new Date(item.timestamp).toLocaleDateString()}</span>
                          <h4 className="text-3xl italic group-hover:text-[#0055FF] transition-colors">{item.input.high_level_goal?.substring(0, 45)}...</h4>
                       </div>
                       <Icons.Sparkles className="w-8 h-8 text-slate-200 group-hover:text-[#0055FF]" />
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
