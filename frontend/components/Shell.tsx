"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutGrid,
    Sparkles,
    Bot,
    BarChart3,
    Beaker,
    Settings,
    Menu,
    Sun,
    Moon,
    Zap
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ShellProps {
    children: React.ReactNode;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}

export default function Shell({ children, activeTab = "grid", onTabChange }: ShellProps) {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { id: "grid", label: "Data Editor", icon: LayoutGrid, color: "from-neon-cyan to-neon-blue" },
        { id: "synthetic", label: "Generate Data", icon: Sparkles, color: "from-neon-purple to-neon-magenta" },
        { id: "automl", label: "AutoML Agent", icon: Bot, color: "from-neon-green to-neon-cyan" },
        { id: "analytics", label: "Stats Agent", icon: BarChart3, color: "from-neon-blue to-neon-purple" },
        { id: "meta", label: "Meta-Scientist", icon: Beaker, color: "from-neon-magenta to-neon-pink" },
    ];

    return (
        <div className="flex h-screen w-full dark:bg-bg-dark bg-bg-light dark:text-text-dark text-text-light">
            <aside
                className={`
                    flex flex-col dark:border-border-dark border-gray-300 border-r
                    dark:bg-bg-secondary bg-white transition-all duration-300 ease-in-out
                    ${collapsed ? "w-16" : "w-64"}
                `}
            >
                <div className="h-16 flex items-center px-4 dark:border-border-dark border-gray-300 border-b">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="relative w-10 h-10 rounded-lg dark:bg-gradient-to-br dark:from-neon-cyan dark:to-neon-purple bg-gradient-to-br from-indigo-500 to-purple-500 shrink-0 flex items-center justify-center shadow-lg dark:shadow-neon-cyan"
                        >
                            <Zap className="w-6 h-6 text-white" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-lg dark:bg-neon-cyan bg-indigo-400 blur-md -z-10"
                            />
                        </motion.div>
                        {!collapsed && (
                            <div>
                                <span className="font-display font-bold text-lg tracking-tight whitespace-nowrap dark:text-neon-cyan text-indigo-600">
                                    SYNGEN PI
                                </span>
                                <div className="text-[10px] dark:text-text-muted text-gray-500 uppercase tracking-widest">
                                    MCP Studio
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="ml-auto p-2 rounded-lg dark:text-text-muted text-gray-500 dark:hover:bg-bg-tertiary hover:bg-gray-100 transition-colors"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item, index) => {
                        const isActive = activeTab === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => onTabChange?.(item.id)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden
                                    ${isActive
                                        ? "dark:text-neon-cyan text-indigo-600 font-semibold"
                                        : "dark:text-text-muted text-gray-600 dark:hover:text-text-dark hover:text-gray-900"
                                    }
                                `}
                            >
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            className={`absolute inset-0 dark:bg-gradient-to-r ${item.color} bg-indigo-100 opacity-10 rounded-xl`}
                                        />
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeBorder"
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            exit={{ scaleY: 0 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            className={`absolute left-0 top-2 bottom-2 w-1 dark:bg-gradient-to-b ${item.color} bg-indigo-600 rounded-r-full`}
                                        />
                                    )}
                                </AnimatePresence>

                                <div className={`
                                    relative z-10 p-2 rounded-lg transition-all
                                    ${isActive
                                        ? `dark:bg-gradient-to-br ${item.color} bg-indigo-500 dark:shadow-neon-cyan shadow-md`
                                        : "dark:bg-bg-tertiary bg-gray-100 dark:group-hover:bg-border-glow group-hover:bg-gray-200"
                                    }
                                `}>
                                    <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'dark:text-text-muted text-gray-600'}`} />
                                </div>

                                {!collapsed && (
                                    <span className="relative z-10">{item.label}</span>
                                )}

                                {!collapsed && (
                                    <span className={`
                                        ml-auto text-[10px] font-mono relative z-10
                                        ${isActive ? 'dark:text-neon-cyan/60 text-indigo-400' : 'dark:text-text-muted/50 text-gray-400'}
                                    `}>
                                        0{index + 1}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                <div className="p-3 dark:border-border-dark border-gray-300 border-t space-y-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium dark:text-text-secondary text-gray-600 dark:hover:bg-bg-tertiary hover:bg-gray-100 transition-all glow-button"
                    >
                        <motion.div
                            animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                            transition={{ duration: 0.3 }}
                            className="w-5 h-5 shrink-0"
                        >
                            {theme === 'dark' ? <Moon className="w-5 h-5 dark:text-neon-cyan text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                        </motion.div>
                        {!collapsed && <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>}
                    </motion.button>

                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium dark:text-text-muted text-gray-500 dark:hover:bg-bg-tertiary hover:bg-gray-100 transition-colors">
                        <Settings className="w-5 h-5" />
                        {!collapsed && <span>Settings</span>}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden dark:bg-bg-primary bg-bg-light">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
