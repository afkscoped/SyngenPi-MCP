"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import SpreadsheetEditor from "@/components/SpreadsheetEditor";
import SyntheticPanel from "@/components/SyntheticPanel";
import MLPanel from "@/components/MLPanel";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import MetaPanel from "@/components/MetaPanel";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

export default function Page() {
  const [activeTab, setActiveTab] = useState<string>("home");

  const renderContent = () => {
    switch (activeTab) {
      case "grid": return <SpreadsheetEditor />;
      case "synthetic": return <SyntheticPanel />;
      case "automl": return <MLPanel />;
      case "analytics": return <AnalyticsPanel />;
      case "meta": return <MetaPanel />;
      default: return (
        <div className="h-full flex flex-col items-center justify-center relative bg-bg">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.05] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="text-center max-w-3xl px-6 relative z-10"
          >
            {/* Logo Float */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 mx-auto mb-8 bg-gradient-to-tr from-accent/10 to-accent2/10 rounded-full flex items-center justify-center border border-accent/20 backdrop-blur-xl shadow-lg shadow-accent/10"
            >
              <Zap className="w-10 h-10 text-accent drop-shadow-sm" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 text-text">
              <span className="text-text">SYNGEN PI</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent2">.MCP</span>
            </h1>

            <p className="text-xl text-muted mb-12 font-sans font-light tracking-wide leading-relaxed">
              Orchestrate Molecular Control. Real-time experiment control, secure data capture, and AI-assisted synthesis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="relative group w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab("grid")}
                  className="relative w-full sm:w-auto px-8 py-4 bg-text text-white rounded-xl leading-none flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-medium"
                >
                  <Sparkles className="w-4 h-4 text-accent2" />
                  <span>Initialize Workspace</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <button
                onClick={() => setActiveTab("synthetic")}
                className="px-8 py-4 rounded-xl text-muted hover:text-text border border-border hover:border-accent hover:bg-white transition-all text-sm font-medium tracking-wide uppercase bg-white/50"
              >
                Import Dataset
              </button>
            </div>
          </motion.div>

          {/* Footer Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute bottom-12 flex gap-8 text-xs text-muted font-mono tracking-widest uppercase"
          >
            <span>v2.4.0 Stable</span>
            <span>•</span>
            <span className="text-accent2">System Operational</span>
            <span>•</span>
            <span>Encrypted</span>
          </motion.div>
        </div>
      );
    }
  };

  return (
    <Shell activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Shell>
  );
}
