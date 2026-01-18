
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FileItem {
    name: string;
    url: string;
    size: string;
    created: string;
}

interface FilePickerProps {
    onSelect: (file: FileItem) => void;
    onCancel: () => void;
}

export default function FilePicker({ onSelect, onCancel }: FilePickerProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await fetch("/api/backend/system/files");
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setFiles(data.files || []);
            } catch (err: any) {
                setError(err.message || "Failed to load files");
            } finally {
                setLoading(false);
            }
        };
        fetchFiles();
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h3 className="font-semibold text-white">Select a Dataset</h3>
                    <button onClick={onCancel} className="text-zinc-400 hover:text-white">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading && (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin h-6 w-6 border-2 border-cyan-500 rounded-full border-t-transparent"></div>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-sm text-center py-4">{error}</div>
                    )}

                    {!loading && !error && files.length === 0 && (
                        <div className="text-zinc-500 text-center py-8 text-sm">
                            No generated files found.<br />Go to <b>Synthetic</b> tab to create one.
                        </div>
                    )}

                    <div className="space-y-2">
                        {files.map((file) => (
                            <button
                                key={file.name}
                                onClick={() => onSelect(file)}
                                className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-cyan-500/30 transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-zinc-200 group-hover:text-cyan-400 truncate pr-2">
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-zinc-500 whitespace-nowrap">{file.size}</span>
                                </div>
                                <div className="text-xs text-zinc-600 mt-1 flex justify-between">
                                    <span>{file.created}</span>
                                    <span className="text-cyan-500/0 group-hover:text-cyan-500/100 transition-colors">Select →</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
