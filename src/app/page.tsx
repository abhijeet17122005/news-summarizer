"use client";

import { useState } from "react";
import { 
  Bot, 
  Link as LinkIcon, 
  FileText, 
  AlertCircle, 
  ChevronRight, 
  Activity, 
  Sparkles,
  BarChart4,
  Plus,
  Trash2,
  RefreshCcw,
  CheckCircle2,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

interface SourceState {
  id: string;
  type: "url" | "text";
  data: string;
  result?: any;
  error?: string;
}

const getGridClasses = (count: number) => {
  if (count === 1) return "max-w-3xl mx-auto";
  if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-8";
  return "grid grid-cols-1 lg:grid-cols-3 gap-6";
};

const LoadingSkeleton = ({ sourceCount }: { sourceCount: number }) => (
  <div className={getGridClasses(sourceCount)}>
    {Array.from({ length: sourceCount }).map((_, index) => (
      <motion.div 
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
        className="glass-panel flex flex-col h-full overflow-hidden border border-glass-border shadow-[0_0_15px_rgba(255,255,255,0.05)]"
      >
        <div className="bg-foreground/5 p-4 border-b border-glass-border flex flex-col gap-2 relative h-[80px]">
          <div className="w-16 h-4 bg-foreground/10 rounded-full animate-pulse"></div>
          <div className="w-3/4 h-3 bg-foreground/10 rounded-full animate-pulse mt-1"></div>
        </div>
        <div className="flex divide-x divide-glass-border border-b border-glass-border bg-foreground/5 h-[64px]">
          <div className="flex-1 p-3 flex flex-col items-center justify-center gap-2">
             <div className="w-12 h-2 bg-foreground/10 rounded-full animate-pulse"></div>
             <div className="w-8 h-4 bg-foreground/10 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1 p-3 flex flex-col items-center justify-center gap-2">
             <div className="w-12 h-2 bg-foreground/10 rounded-full animate-pulse"></div>
             <div className="w-8 h-4 bg-foreground/10 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="p-5 flex flex-col items-center justify-center border-b border-glass-border bg-black/20 h-[100px]">
            <div className="w-24 h-6 bg-brand-500/20 rounded-full animate-pulse mb-3"></div>
            <div className="w-full flex items-center justify-between gap-3 text-xs">
              <div className="w-16 h-2 bg-foreground/10 rounded-full"></div>
              <div className="flex-1 h-1.5 bg-foreground/5 rounded-full overflow-hidden mx-2"></div>
              <div className="w-8 h-2 bg-foreground/10 rounded-full"></div>
            </div>
        </div>
        <div className="p-5 space-y-4 flex-1 bg-black/10">
             <div className="w-16 h-3 bg-foreground/10 rounded animate-pulse"></div>
             <div className="space-y-2 mt-2">
               <div className="w-full h-2 bg-foreground/5 rounded animate-pulse"></div>
               <div className="w-full h-2 bg-foreground/5 rounded animate-pulse"></div>
               <div className="w-5/6 h-2 bg-foreground/5 rounded animate-pulse"></div>
               <div className="w-3/4 h-2 bg-foreground/5 rounded animate-pulse"></div>
             </div>
        </div>
      </motion.div>
    ))}
  </div>
);


export default function Home() {
  const [sources, setSources] = useState<SourceState[]>([
    { id: Math.random().toString(36).substring(7), type: "url", data: "" }
  ]);
  const [tone, setTone] = useState<string>("Neutral Summary");
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [hasResults, setHasResults] = useState(false);

  const TONES = ["Neutral Summary", "Fact-Only", "Explain like I'm 10"];

  const generateSource = (): SourceState => ({
    id: Math.random().toString(36).substring(7),
    type: "url",
    data: ""
  });

  const addSource = () => {
    if (sources.length >= 3) return;
    setSources([...sources, generateSource()]);
  };

  const updateSource = (id: string, updates: Partial<SourceState>) => {
    setSources(sources.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSource = (id: string) => {
    if (sources.length <= 1) return;
    setSources(sources.filter((s) => s.id !== id));
  };

  const resetAll = () => {
     setHasResults(false);
     setGlobalError("");
     setSources(sources.map(s => ({ ...s, result: undefined, error: undefined })));
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAnalyze = async () => {
    const validSources = sources.filter(s => s.data.trim().length > 0);
    
    if (validSources.length === 0) {
      setGlobalError("Please provide data in at least one field.");
      return;
    }
    
    // Regex URL validation
    for (const source of validSources) {
      if (source.type === "url" && !isValidUrl(source.data)) {
        setGlobalError(`The URL "${source.data.substring(0, 20)}..." is not valid. Make sure to include http:// or https://`);
        return;
      }
    }
    
    setIsLoading(true);
    setGlobalError("");
    setHasResults(false); // keep false so Skeleton loads
    
    // Clear previous results/errors visually during loading
    setSources(sources.map(s => ({ ...s, result: undefined, error: undefined })));

    try {
      const promises = validSources.map(async (source) => {
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: source.type, data: source.data, tone }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Analysis failed");
          
          return { id: source.id, result: data, error: undefined };
        } catch (e: any) {
          return { id: source.id, result: undefined, error: e.message };
        }
      });

      const outcomes = await Promise.all(promises);
      
      setSources(sources.map(s => {
        const out = outcomes.find(o => o.id === s.id);
        if (out) return { ...s, result: out.result, error: out.error };
        return s;
      }));
      setHasResults(true); // Now reveal actual data
    } catch (err: any) {
      setGlobalError("A critical error occurred analyzing the sources.");
    } finally {
      setIsLoading(false);
    }
  };

  // UI Helpers
  const getBiasColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("neutral")) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (l.includes("right")) return "bg-red-500/20 text-red-400 border-red-500/50";
    if (l.includes("left")) return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    return "bg-orange-500/20 text-orange-400 border-orange-500/50";
  };

  const getPercentageColor = (confidence: number) => {
    if (confidence > 80) return "text-red-400";
    if (confidence > 50) return "text-orange-400";
    return "text-green-400";
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10 font-sans pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="text-center space-y-4 pt-8 print-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-2"
          >
            <Bot className="w-8 h-8 text-brand-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400"
          >
           AI News Analyst
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg text-foreground/70 max-w-2xl mx-auto font-medium"
          >
            Instantly compare multiple perspectives. Extract the raw facts, identify hidden rhetoric, and summarize narratives seamlessly.
          </motion.p>
        </header>

        {/* Global Tone Selector */}
        {!hasResults && !isLoading && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="max-w-3xl mx-auto glass-panel p-6"
           >
             <h3 className="text-sm border-b border-glass-border pb-3 font-semibold text-foreground/80 flex items-center justify-center gap-2 mb-4 uppercase tracking-widest">
               <Sparkles className="w-4 h-4 text-brand-400" /> Global Summary Tone Configuration
             </h3>
             <div className="flex flex-wrap justify-center gap-3">
               {TONES.map(t => (
                 <button
                   key={t}
                   onClick={() => setTone(t)}
                   className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${tone === t ? 'border-brand-500 bg-brand-500/20 text-brand-400 shadow-[0_0_20px_rgba(99,102,241,0.25)]' : 'border-glass-border hover:border-brand-500/50 text-foreground/60 hover:text-foreground'}`}
                 >
                   {t}
                 </button>
               ))}
             </div>
           </motion.div>
        )}

        {/* Loading Implementation */}
        {isLoading && (
          <div className="space-y-8 relative">
            <div className="flex justify-between items-center bg-transparent py-4 text-brand-400 animate-pulse">
               <h2 className="text-xl font-bold flex items-center gap-3 justify-center w-full">
                 <Activity className="w-6 h-6 animate-spin-slow" /> Analyzing Multi-Dimensional Sentiments...
               </h2>
            </div>
            <LoadingSkeleton sourceCount={sources.length} />
          </div>
        )}

        {/* Dynamic Inputs or Results */}
        {!hasResults && !isLoading ? (
          <div className="space-y-8 max-w-4xl mx-auto">
            <AnimatePresence>
              {sources.map((source, index) => (
                <motion.div 
                  key={source.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="glass-panel p-6 relative group border-t-4 border-t-brand-500/50"
                >
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-400/10 px-3 py-1 rounded-full">Source {index + 1}</span>
                     {sources.length > 1 && (
                       <button onClick={() => removeSource(source.id)} className="text-foreground/40 hover:text-red-400 transition-colors p-1">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                  
                  <div className="flex bg-foreground/5 rounded-lg p-1 border border-glass-border mb-4 shadow-inner">
                    <button
                      className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 ${source.type === "url" ? 'bg-glass-border text-foreground shadow-sm' : 'text-foreground/40 hover:text-foreground'}`}
                      onClick={() => updateSource(source.id, { type: "url" })}
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> URL Link
                    </button>
                    <button
                      className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 ${source.type === "text" ? 'bg-glass-border text-foreground shadow-sm' : 'text-foreground/40 hover:text-foreground'}`}
                      onClick={() => updateSource(source.id, { type: "text" })}
                    >
                      <FileText className="w-3.5 h-3.5" /> Raw Text
                    </button>
                  </div>

                  {source.type === "url" ? (
                    <input 
                      type="url"
                      id={`url-input-${source.id}`}
                      aria-label="URL to analyze"
                      placeholder="https://news-site.com/article..."
                      className="w-full bg-black/20 border border-glass-border rounded-xl px-4 py-3.5 placeholder-foreground/20 focus:outline-none focus:border-brand-500/50 transition-all text-foreground text-sm"
                      value={source.data}
                      onChange={(e) => updateSource(source.id, { data: e.target.value })}
                    />
                  ) : (
                    <div className="relative">
                      <textarea 
                        rows={5}
                        maxLength={30000}
                        id={`text-input-${source.id}`}
                        aria-label="Raw text to analyze"
                        placeholder="Paste the raw article content here (30,000 char max)..."
                        className="w-full bg-black/20 border border-glass-border rounded-xl px-4 py-3 placeholder-foreground/20 focus:outline-none focus:border-brand-500/50 transition-all text-foreground text-sm resize-none"
                        value={source.data}
                        onChange={(e) => updateSource(source.id, { data: e.target.value })}
                      />
                      {source.data.length > 28000 && (
                        <span className="absolute bottom-3 right-4 text-xs text-orange-400 bg-black/50 px-2 py-1 rounded">
                          {30000 - source.data.length} chars left
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {globalError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-start gap-3 mt-4 font-medium max-w-4xl shadow-xl"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> 
                <p className="flex-1">{globalError}</p>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-glass-border pt-6">
              <button 
                onClick={addSource}
                aria-label="Add Another Source"
                disabled={sources.length >= 3}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 font-medium text-sm transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed print-hidden"
              >
                <Plus className="w-4 h-4" /> Add Another Source
              </button>

              <button
                onClick={handleAnalyze}
                aria-label="Compare Analytics"
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[200px] bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2 transform active:scale-95 print-hidden"
              >
                Compare Analytics <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : hasResults ? (
          <div className="space-y-8 relative">
            <div className="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-glass-border shadow-lg print-hidden">
               <h2 className="text-xl font-bold flex items-center gap-3">
                 <CheckCircle2 className="w-6 h-6 text-green-400" /> Comparison Dashboard
               </h2>
               <div className="flex flex-wrap gap-3">
                 <button 
                   onClick={() => window.print()}
                   aria-label="Save PDF Report"
                   className="flex items-center gap-2 px-5 py-2 bg-brand-600/20 hover:bg-brand-600/50 border border-brand-500/50 rounded-full text-brand-200 text-sm font-bold transition-all shadow-lg"
                 >
                   <Printer className="w-4 h-4" /> Save PDF
                 </button>
                 <button 
                   onClick={resetAll}
                   aria-label="Analyze Something Else"
                   className="flex items-center gap-2 px-5 py-2 bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/50 rounded-full text-brand-300 text-sm font-bold transition-all shadow-lg"
                 >
                   <RefreshCcw className="w-4 h-4" /> Analyze Something Else
                 </button>
               </div>
            </div>

            <div className={getGridClasses(sources.length)}>
              {sources.map((source, index) => (
                <motion.div 
                  key={source.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="glass-panel flex flex-col h-full overflow-hidden hover:border-glass-border/70 transition-colors"
                >
                  {/* Article Source Header */}
                  <div className="bg-black/30 p-4 border-b border-glass-border flex flex-col gap-2 relative">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/20 blur-3xl -mr-10 -mt-10 rounded-full"></div>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 self-start px-2 py-0.5 rounded-full border border-brand-500/20">Source {index + 1}</span>
                     <p className="text-xs text-foreground/50 truncate pr-4 font-mono">
                       {source.type === 'url' ? source.data : 'RAW TEXT INPUTTED'}
                     </p>
                  </div>

                  {source.error ? (
                    <div className="p-8 flex flex-col items-center justify-center h-full text-center bg-black/10">
                       <AlertCircle className="w-10 h-10 text-red-500/50 mb-3" />
                       <h3 className="text-red-400 font-bold mb-1">Extraction Failed</h3>
                       <p className="text-xs text-foreground/50 max-w-[200px] mb-4">{source.error}</p>
                       <button 
                         onClick={() => {
                           const updatedSource = sources.find(s => s.id === source.id);
                           if (!updatedSource) return;
                           
                           setSources(sources.map(s => s.id === source.id ? { ...s, error: undefined, result: undefined } : s));
                           
                           fetch("/api/analyze", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({ type: updatedSource.type, data: updatedSource.data, tone }),
                           }).then(res => res.json()).then(data => {
                             if (data.error) throw new Error(data.error);
                             setSources(prev => prev.map(s => s.id === source.id ? { ...s, result: data, error: undefined } : s));
                           }).catch(err => {
                             setSources(prev => prev.map(s => s.id === source.id ? { ...s, result: undefined, error: err.message } : s));
                           });
                         }}
                         aria-label="Retry Analysis"
                         className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-xs font-bold transition-all print-hidden"
                       >
                         Retry Analysis
                       </button>
                    </div>
                  ) : source.result ? (
                    <div className="flex flex-col h-full">
                      {/* STATS ROW */}
                      <div className="flex divide-x divide-glass-border border-b border-glass-border bg-foreground/5">
                         <div className="flex-1 p-3 text-center">
                            <span className="block text-[10px] text-foreground/40 uppercase mb-1 font-bold">Emotion/10</span>
                            <span className="text-xl font-black text-foreground drop-shadow-md">{source.result.emotionalIntensity || 0}</span>
                         </div>
                         <div className="flex-1 p-3 text-center">
                            <span className="block text-[10px] text-foreground/40 uppercase mb-1 font-bold">Word Count</span>
                            <span className="text-xl font-black text-foreground drop-shadow-md">{source.result.wordCount || 0}</span>
                         </div>
                      </div>

                      {/* BIAS CLASSIFIER */}
                      <div className="p-6 flex flex-col items-center justify-center border-b border-glass-border bg-black/40">
                         <div className={`px-5 py-2 rounded-full text-sm font-black border mb-4 shadow-lg ${getBiasColor(source.result.biasLabel)}`}>
                           {source.result.biasLabel || "Unknown"}
                         </div>
                         <div className="w-full flex items-center justify-between gap-3 text-xs">
                           <span className="text-foreground/50 font-medium">Confidence Map</span>
                           <div className="flex-1 h-2 bg-glass-border rounded-full overflow-hidden mx-2 shadow-inner">
                             <div className={`h-full transition-all duration-1000 ${source.result.confidence > 80 ? 'bg-red-500' : source.result.confidence > 50 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${source.result.confidence}%` }}></div>
                           </div>
                           <span className={`font-mono font-bold ${getPercentageColor(source.result.confidence)}`}>{source.result.confidence}%</span>
                         </div>
                      </div>

                      <div className="p-6 space-y-6 flex-1 bg-black/10">
                        {/* SUMMARY */}
                        <div>
                          <h4 className="text-xs tracking-widest uppercase text-foreground/50 font-bold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Summary
                          </h4>
                          <div className="text-sm text-foreground/90 leading-relaxed font-medium">
                            <ReactMarkdown
                              components={{
                                p: ({node, ...props}) => <p className="mb-3" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-extrabold text-brand-400" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 marker:text-brand-500/50 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="" {...props} />,
                                h1: ({node, ...props}) => <h1 className="text-lg font-bold text-foreground mb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-md font-bold text-foreground mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="font-bold text-foreground mb-2" {...props} />,
                                hr: ({node, ...props}) => <hr className="border-glass-border my-4" {...props} />,
                              }}
                            >
                              {source.result.summary}
                            </ReactMarkdown>
                          </div>
                        </div>
                        
                        {/* HIGHLIGHTS */}
                        {source.result.highlights && source.result.highlights.length > 0 && (
                          <div className="pt-5 border-t border-glass-border">
                            <h4 className="text-xs tracking-widest uppercase text-orange-400 font-bold mb-4 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" /> Flagged Narratives
                            </h4>
                            <div className="space-y-3">
                              {source.result.highlights.map((h: any, i: number) => (
                                <div key={i} className="text-xs bg-red-900/10 border border-red-500/20 p-3 rounded-xl shadow-sm">
                                  <p className="italic text-foreground/90 mb-2 font-serif text-[13px] leading-relaxed">"{h.text}"</p>
                                  <p className="text-red-400/90 font-bold uppercase tracking-widest flex items-center gap-1.5" style={{fontSize: '0.65rem'}}>
                                     <Sparkles className="w-3 h-3" /> {h.reason}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
