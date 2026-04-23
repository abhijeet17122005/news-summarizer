"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, PieChart, Activity, Clock, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface HistoryItem {
  source: string;
  bias: string;
  date: string;
  title: string;
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("news_history") || "[]");
    setHistory(data);
    setLoading(false);
  }, []);

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your analysis history?")) {
      localStorage.removeItem("news_history");
      setHistory([]);
    }
  };

  const getBiasStats = () => {
    const stats: Record<string, number> = {
      "Left-Leaning": 0,
      "Right-Leaning": 0,
      "Neutral": 0,
      "Emotionally Charged": 0
    };
    
    history.forEach(item => {
      const b = item.bias || "Neutral";
      if (stats[b] !== undefined) {
        stats[b]++;
      } else {
        // Find closest match or default to neutral
        const found = Object.keys(stats).find(k => b.toLowerCase().includes(k.toLowerCase().split('-')[0]));
        if (found) stats[found]++;
        else stats["Neutral"]++;
      }
    });
    
    return stats;
  };

  if (loading) return null;

  const stats = getBiasStats();
  const total = history.length;

  const activityData = (() => {
    const activityInfo: Record<string, number> = {};
    history.forEach(item => {
      const d = new Date(item.date).toISOString().split('T')[0];
      activityInfo[d] = (activityInfo[d] || 0) + 1;
    });
    
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activityInfo[dateStr] || 0;
      days.push({ date: dateStr, count });
    }

    let currentStreak = 0;
    for (let i = 29; i >= 0; i--) {
       if (days[i].count > 0) currentStreak++;
       else if (i !== 29) break; 
    }
    return { days, currentStreak };
  })();

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3"
            >
              <BarChart2 className="w-10 h-10 text-brand-400" /> My Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-foreground/60"
            >
              Insights into your media diet and past analyses.
            </motion.p>
          </div>
          
          <button 
            onClick={clearHistory}
            disabled={total === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Clear History
          </button>
        </header>

        {total === 0 ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-center space-y-4">
            <PieChart className="w-16 h-16 text-foreground/20" />
            <h2 className="text-xl font-bold">No Reading Data Yet</h2>
            <p className="text-foreground/50 max-w-sm">
              Your reading diet and past analyses will appear here once you analyze some news articles.
            </p>
            <Link href="/" className="mt-4 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-full font-bold flex items-center gap-2 transition-colors">
              Start Analyzing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Activity Streak Widget */}
            <div className="glass-panel p-6 w-full">
              <div className="flex justify-between items-end mb-4">
                 <div>
                   <h3 className="text-sm tracking-widest uppercase text-foreground/50 font-bold flex items-center gap-2 mb-1">
                     <Activity className="w-4 h-4" /> 30-Day Activity Streak
                   </h3>
                   <p className="text-2xl font-black text-brand-400">{activityData.currentStreak} Days</p>
                 </div>
              </div>
              <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] sm:grid-cols-[repeat(30,minmax(0,1fr))] gap-1.5 pb-2">
                 {activityData.days.map((day) => (
                    <div 
                      key={day.date} 
                      title={`${day.date}: ${day.count} articles analyzed`}
                      className={`h-8 sm:h-12 w-full rounded-md sm:rounded-lg transition-colors ${
                        day.count === 0 ? 'bg-glass-border/30' : 
                        day.count < 3 ? 'bg-brand-500/40' : 
                        day.count < 5 ? 'bg-brand-500/70' : 'bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                      }`}
                    ></div>
                 ))}
              </div>
              <div className="flex justify-between text-[10px] text-foreground/40 mt-2 font-bold uppercase tracking-widest">
                 <span>30 Days Ago</span>
                 <span>Today</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Stats Overview */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-panel p-6">
                <h3 className="text-sm tracking-widest uppercase text-foreground/50 font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Reading Diet
                </h3>
                
                <div className="space-y-6">
                  {Object.entries(stats).map(([label, count], i) => {
                    const percentage = Math.round((count / total) * 100) || 0;
                    let color = "bg-brand-500";
                    if (label.includes("Left")) color = "bg-blue-500";
                    if (label.includes("Right")) color = "bg-red-500";
                    if (label.includes("Neutral")) color = "bg-green-500";
                    if (label.includes("Emotion")) color = "bg-orange-500";

                    return (
                      <div key={label} className="space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span>{label}</span>
                          <span className="text-foreground/60">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full ${color}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="glass-panel p-6 text-center">
                 <div className="text-5xl font-black text-brand-400 mb-2">{total}</div>
                 <div className="text-sm uppercase tracking-widest text-foreground/50 font-bold">Total Analyzed</div>
              </div>
            </div>

            {/* History List */}
            <div className="lg:col-span-2 glass-panel p-6">
              <h3 className="text-sm tracking-widest uppercase text-foreground/50 font-bold mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent History
              </h3>
              
              <div className="space-y-4">
                {history.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 bg-black/20 rounded-xl border border-glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground mb-1 truncate text-sm">
                        {item.title}
                      </h4>
                      <p className="text-xs text-foreground/50 truncate mb-2 font-mono">
                        {item.source}
                      </p>
                      <span className="text-[10px] text-foreground/40 uppercase">
                        {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                         item.bias.includes("Left") ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                         item.bias.includes("Right") ? "bg-red-500/20 text-red-400 border-red-500/30" :
                         item.bias.includes("Emotion") ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                         "bg-green-500/20 text-green-400 border-green-500/30"
                       }`}>
                         {item.bias}
                       </span>
                       
                       <Link 
                         href={`/?url=${encodeURIComponent(item.source)}`}
                         className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                       >
                         Analyze Again <ArrowRight className="w-3 h-3" />
                       </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </main>
  );
}
