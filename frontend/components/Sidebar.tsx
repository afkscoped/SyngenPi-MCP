"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Database, Bot, BarChart3, Beaker, Zap } from "lucide-react";

type Phase = "explore" | "synthetic" | "ml" | "assurance" | "meta";

interface SidebarProps {
    currentPhase: Phase;
    setPhase: (p: Phase) => void;
}

export default function Sidebar({ currentPhase, setPhase }: SidebarProps) {
    const navItems = [
        { id: "explore", label: "Data Editor", icon: LayoutDashboard, color: "from-blue-500 to-cyan-500" },
        { id: "synthetic", label: "Generate Data", icon: Database, color: "from-emerald-500 to-teal-500" },
        { id: "ml", label: "AutoML", icon: Bot, color: "from-purple-500 to-pink-500" },
        { id: "assurance", label: "Stats Agent", icon: BarChart3, color: "from-cyan-500 to-blue-500" },
        { id: "meta", label: "Meta-Scientist", icon: Beaker, color: "from-amber-500 to-orange-500" },
    ];

    return (
        <div className="w-72 bg-black/40 backdrop-blur-2xl border-r border-white/10 flex flex-col h-full">
            {/* Logo */}
            <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-xl blur-xl opacity-40" />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-white">MCP Studio</span>
                        <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Synthetic Data Platform</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3">
                <div className="text-[10px] font-medium text-gray-500 px-3 mb-3 uppercase tracking-widest">
                    Workflow
                </div>
                <nav className="space-y-1">
                    {navItems.map((item, index) => {
                        const isActive = currentPhase === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => setPhase(item.id as Phase)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative group
                                    ${isActive
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                {/* Active Background */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-20 rounded-xl`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                {/* Active Border */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeBorder"
                                        className={`absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b ${item.color} rounded-r-full`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                {/* Icon */}
                                <div className={`
                                    relative z-10 p-2 rounded-lg transition-all duration-300
                                    ${isActive
                                        ? `bg-gradient-to-br ${item.color} shadow-lg`
                                        : 'bg-white/5 group-hover:bg-white/10'
                                    }
                                `}>
                                    <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                </div>

                                {/* Label */}
                                <span className="relative z-10 font-medium">{item.label}</span>

                                {/* Step Number */}
                                <span className={`
                                    ml-auto text-[10px] font-mono relative z-10
                                    ${isActive ? 'text-white/60' : 'text-gray-600'}
                                `}>
                                    0{index + 1}
                                </span>
                            </motion.button>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <span className="text-xs text-emerald-300 font-medium">System Online</span>
                    </div>
                    <p className="text-[10px] text-emerald-400/50 mt-1">Backend connected • Port 8000</p>
                </div>
            </div>
        </div>
    );
}
