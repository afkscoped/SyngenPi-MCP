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
        <div className="h-full flex flex-col items-center justify-center relative dark:bg-bg-primary bg-bg-light overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="text-center max-w-4xl px-6 relative z-10"
          >
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotateY: [0, 180, 360]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-32 h-32 mx-auto mb-12"
            >
              <div className="absolute inset-0 dark:bg-gradient-to-tr dark:from-neon-cyan dark:to-neon-magenta bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center dark:shadow-neon-cyan shadow-xl">
                <Zap className="w-16 h-16 text-white" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity
                }}
                className="absolute inset-0 dark:bg-neon-cyan bg-indigo-400 rounded-2xl blur-2xl -z-10"
              />
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-display font-black tracking-tight mb-6">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="dark:text-text-dark text-gray-900"
              >
                SYNGEN
              </motion.span>
              {" "}
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="dark:neon-text text-transparent bg-clip-text dark:bg-gradient-to-r dark:from-neon-cyan dark:via-neon-purple dark:to-neon-magenta bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                PI
              </motion.span>
            </h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-4 flex items-center justify-center gap-2"
            >
              <div className="h-px dark:bg-gradient-to-r dark:from-transparent dark:via-neon-cyan dark:to-transparent bg-gradient-to-r from-transparent via-indigo-400 to-transparent w-20" />
              <span className="text-sm dark:text-neon-purple text-indigo-600 font-display tracking-[0.3em] uppercase">
                MCP Studio
              </span>
              <div className="h-px dark:bg-gradient-to-r dark:from-transparent dark:via-neon-cyan dark:to-transparent bg-gradient-to-r from-transparent via-indigo-400 to-transparent w-20" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg dark:text-text-secondary text-gray-600 mb-12 font-light max-w-2xl mx-auto leading-relaxed"
            >
              Advanced synthetic data generation with AI-powered statistical analysis.
              Real-time experiment control and molecular synthesis optimization.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("grid")}
                className="group relative w-full sm:w-auto px-8 py-4 dark:bg-gradient-to-r dark:from-neon-cyan dark:to-neon-blue bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-3 dark:shadow-neon-cyan shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-neon-purple dark:to-neon-magenta bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Initialize Workspace</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("synthetic")}
                className="px-8 py-4 rounded-xl dark:text-text-secondary text-gray-600 dark:border-border-glow border-2 border-gray-300 dark:hover:border-neon-cyan hover:border-indigo-500 dark:hover:text-neon-cyan hover:text-indigo-600 dark:hover:bg-bg-tertiary hover:bg-gray-50 transition-all text-sm font-semibold tracking-wide uppercase w-full sm:w-auto glow-button"
              >
                Generate Data
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="absolute bottom-8 flex items-center gap-6 text-xs dark:text-text-muted text-gray-500 font-mono"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full dark:bg-neon-green bg-green-500 animate-pulse" />
              <span>System Online</span>
            </div>
            <span className="dark:text-border-glow text-gray-400">|</span>
            <span>v2.4.0</span>
            <span className="dark:text-border-glow text-gray-400">|</span>
            <span className="dark:text-neon-cyan text-indigo-600">Encrypted</span>
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
