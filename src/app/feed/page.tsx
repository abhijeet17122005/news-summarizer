"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Zap, Clock, BookmarkPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
  imageUrl: string;
}

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch("/api/feed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setArticles(data.articles);
      } catch (err: any) {
        setError(err.message || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleAnalyze = (url: string) => {
    router.push(`/?url=${encodeURIComponent(url)}`);
  };

  const getSourceColor = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes("bbc")) return "bg-red-600";
    if (s.includes("nyt")) return "bg-gray-800";
    if (s.includes("fox")) return "bg-blue-600";
    if (s.includes("cnn")) return "bg-red-500";
    if (s.includes("jazeera")) return "bg-orange-500";
    return "bg-brand-500";
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-4 pt-8">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
          >
           Discover The News
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-foreground/60 max-w-2xl mx-auto"
          >
            Real-time unbiased aggregation. See a headline you don't trust? Analyze it instantly.
          </motion.p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : error ? (
           <div className="text-center text-red-400 p-8 glass-panel">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article, i) => (
              <motion.article 
                key={article.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300"
              >
                <div 
                  className="h-48 w-full bg-cover bg-center relative" 
                  style={{ backgroundImage: `url(${article.imageUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <span className={`absolute top-3 right-3 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full text-white shadow-lg ${getSourceColor(article.source)}`}>
                    {article.source}
                  </span>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-foreground/50 mb-3">
                     <Clock className="w-3.5 h-3.5" />
                     {new Date(article.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(article.pubDate).toLocaleDateString()}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 leading-tight">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:text-brand-400 transition-colors">
                      {article.title}
                    </a>
                  </h3>
                  
                  <p className="text-sm text-foreground/60 mb-6 flex-1 line-clamp-3">
                    {article.snippet}
                  </p>
                  
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleAnalyze(article.link)}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Zap className="w-4 h-4" /> Analyze Bias
                    </button>
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2.5 bg-foreground/10 hover:bg-foreground/20 rounded-lg text-foreground transition-colors"
                      title="Read Original"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
