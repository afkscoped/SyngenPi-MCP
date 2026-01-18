"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn"; // we might need to create this util or just use template literals

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`card overflow-hidden ${className || ""}`}>
            {children}
        </div>
    );
}

// Hero optimized for new Journal aesthetic
export function Hero({ title, subtitle }: { title: React.ReactNode; subtitle: string }) {
    return (
        <section className="mb-8 border-b border-border pb-6">
            <h1 className="text-4xl font-display font-bold text-text mb-2 tracking-tight">{title}</h1>
            <p className="text-lg text-muted max-w-2xl leading-relaxed">{subtitle}</p>
        </section>
    );
}

export function Button({
    children,
    variant = 'primary',
    className,
    disabled,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) {
    // Base classes moved from globals.css to avoid @apply issues
    const base = "px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 font-sans active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

    // Updated button variants for "Professional" look
    const variants = {
        primary: "bg-accent text-white hover:bg-accent2 shadow-md hover:shadow-lg border border-transparent",
        secondary: "bg-white border border-border text-text hover:bg-bg hover:border-accent/30 shadow-sm",
        outline: "bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-white",
        ghost: "bg-transparent text-muted hover:text-accent hover:bg-accent/5",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${className || ""}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`w-full px-4 py-3 rounded-lg border border-border bg-white text-text transition-all focus:ring-2 focus:ring-accent/20 outline-none focus:border-accent shadow-sm ${className || ""}`}
            {...props}
        />
    );
}
