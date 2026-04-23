"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, BarChart2, Bot } from "lucide-react";
import { motion } from "framer-motion";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { name: "Analyze", href: "/", icon: Home },
    { name: "Discover", href: "/feed", icon: Compass },
    { name: "My Dashboard", href: "/dashboard", icon: BarChart2 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-brand-400" />
            <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">
              News Analyst
            </span>
          </div>
          
          <div className="flex gap-1 md:gap-4">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-3 py-2 md:px-4 flex items-center gap-2 rounded-full text-sm font-medium transition-all ${
                    isActive 
                      ? "text-brand-400 bg-brand-500/10" 
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{link.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-full border border-brand-500/30 bg-brand-500/5 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
