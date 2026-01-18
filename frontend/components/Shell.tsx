"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    LayoutGrid,
    Sparkles,
    Bot,
    BarChart3,
    Beaker,
    Settings,
    LogOut,
    Menu
} from "lucide-react";

interface ShellProps {
    children: React.ReactNode;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}

export default function Shell({ children, activeTab = "grid", onTabChange }: ShellProps) {
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { id: "grid", label: "Data Editor", icon: LayoutGrid },
        { id: "synthetic", label: "Generate Data", icon: Sparkles },
        { id: "automl", label: "AutoML Agent", icon: Bot },
        { id: "analytics", label: "Stats Agent", icon: BarChart3 },
        { id: "meta", label: "Meta-Scientist", icon: Beaker },
    ];

    return (
        <div className="flex h-screen w-full bg-bg text-text">
            {/* Sidebar */}
            <aside
                className={`
                    flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out
                    ${collapsed ? "w-16" : "w-64"}
                `}
            >
                {/* Header */}
                <div className="h-16 flex items-center px-4 border-b border-border">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-accent text-white shrink-0 flex items-center justify-center shadow-md">
                            <Bot className="w-5 h-5 text-bg" />
                        </div>
                        {!collapsed && (
                            <span className="font-display font-bold text-lg tracking-tight whitespace-nowrap">
                                Syngen Pi
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="ml-auto p-1.5 rounded-md text-muted hover:bg-gray-100 transition-colors"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange?.(item.id)}
                                className={`
                                    w-full flex items-center gap-4 px-4 py-3 rounded-md text-sm font-medium transition-all group relative
                                    ${isActive
                                        ? "bg-accent/10 text-accent font-semibold"
                                        : "text-muted hover:text-text hover:bg-black/5"
                                    }
                                `}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-accent rounded-r-md" />
                                )}

                                <item.icon className={`
                                    w-5 h-5 shrink-0 transition-colors
                                    ${isActive ? "text-accent" : "text-muted group-hover:text-text/80"}
                                `} />

                                {!collapsed && (
                                    <span className="tracking-wide">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-border">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-gray-50 transition-colors">
                        <Settings className="w-5 h-5" />
                        {!collapsed && <span>Settings</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg">
                {/* Top Bar / Header could go here if needed, or included in tabs */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
