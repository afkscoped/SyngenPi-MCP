"use client";

import { motion } from "framer-motion";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`card cyber-card ${className || ""}`}>
            {children}
        </div>
    );
}

export function Hero({ title, subtitle }: { title: React.ReactNode; subtitle: string }) {
    return (
        <section className="mb-8 dark:border-border-dark border-gray-300 border-b pb-6">
            <h1 className="text-4xl font-display font-bold dark:text-text-dark text-gray-900 mb-2 tracking-tight dark:neon-text">{title}</h1>
            <p className="text-lg dark:text-text-secondary text-gray-600 max-w-2xl leading-relaxed">{subtitle}</p>
        </section>
    );
}

export function Button({
    children,
    variant = 'primary',
    className,
    disabled,
    size = 'default',
    onClick,
    type = 'button',
    title,
}: {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    className?: string;
    disabled?: boolean;
    size?: 'sm' | 'default' | 'lg';
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
}) {
    const base = "font-medium transition-all duration-200 flex items-center justify-center gap-2 font-sans active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

    const sizes = {
        sm: "px-3 py-1.5 text-sm rounded-lg",
        default: "px-5 py-2.5 rounded-lg",
        lg: "px-6 py-3 rounded-xl text-lg"
    };

    const variants = {
        primary: "dark:bg-gradient-to-r dark:from-neon-cyan dark:to-neon-blue bg-indigo-600 text-white hover:shadow-neon-cyan dark:hover:from-neon-purple dark:hover:to-neon-magenta hover:bg-indigo-700 shadow-md hover:shadow-lg glow-button",
        secondary: "dark:bg-bg-tertiary bg-white dark:border-border-glow border-gray-300 border dark:text-text-dark text-gray-900 dark:hover:border-neon-cyan hover:border-indigo-500 dark:hover:bg-bg-card hover:bg-gray-50 shadow-sm",
        outline: "bg-transparent border-2 dark:border-neon-cyan border-indigo-500 dark:text-neon-cyan text-indigo-600 dark:hover:bg-neon-cyan/10 hover:bg-indigo-50 glow-button",
        ghost: "bg-transparent dark:text-text-muted text-gray-600 dark:hover:text-neon-cyan hover:text-indigo-600 dark:hover:bg-bg-tertiary hover:bg-gray-100",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${base} ${sizes[size]} ${variants[variant]} ${className || ""}`}
            disabled={disabled}
            onClick={onClick}
            type={type}
            title={title}
        >
            {children}
        </motion.button>
    );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`
                w-full px-4 py-3 rounded-lg
                dark:border-border-dark border-gray-300 border
                dark:bg-bg-tertiary bg-white
                dark:text-text-dark text-gray-900
                transition-all
                dark:focus:ring-2 dark:focus:ring-neon-cyan/20 focus:ring-2 focus:ring-indigo-500/20
                outline-none
                dark:focus:border-neon-cyan focus:border-indigo-500
                shadow-sm
                dark:placeholder:text-text-muted placeholder:text-gray-400
                ${className || ""}
            `}
            {...props}
        />
    );
}
