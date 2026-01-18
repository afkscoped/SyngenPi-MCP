"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, Loader2, X } from "lucide-react";

interface FileDropZoneProps {
    onFileUploaded: (file: { name: string; url: string }) => void;
    accept?: string;
    label?: string;
}

const API_BASE = "/api/backend";

export default function FileDropZone({
    onFileUploaded,
    accept = ".csv,.xlsx,.xls",
    label = "Drop file or click to browse"
}: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const uploadFile = async (file: File) => {
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_BASE}/sheets/upload`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const uploaded = { name: data.filename, url: data.url };
            setUploadedFile(uploaded);
            onFileUploaded(uploaded);
        } catch (err: any) {
            setError(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) uploadFile(files[0]);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files?.length) uploadFile(files[0]);
    };

    const handleClick = () => fileInputRef.current?.click();
    const clearFile = () => { setUploadedFile(null); setError(null); };

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />

            <AnimatePresence mode="wait">
                {uploadedFile ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10">
                                <CheckCircle className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-bold text-text truncate">{uploadedFile.name}</p>
                                <p className="text-[10px] text-muted uppercase tracking-widest">Ready for analysis</p>
                            </div>
                        </div>
                        <button onClick={clearFile} className="p-2 rounded-lg hover:bg-gray-200 text-muted hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleClick}
                        className={`
                            relative py-8 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300
                            ${isDragging
                                ? "border-accent bg-accent/5 shadow-md scale-[1.01]"
                                : "border-border bg-gray-50 hover:border-accent/40 hover:bg-white"
                            }
                            ${uploading ? "pointer-events-none opacity-50" : ""}
                        `}
                    >
                        <div className="flex flex-col items-center gap-3">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            ) : (
                                <div className={`
                                    p-3 rounded-xl transition-all duration-300
                                    ${isDragging ? "bg-accent/20 text-accent" : "bg-white text-muted group-hover:text-accent shadow-sm"}
                                `}>
                                    <Upload className="w-6 h-6" />
                                </div>
                            )}

                            <div className="text-center">
                                <p className={`text-sm font-bold transition-colors ${isDragging ? "text-accent" : "text-text"}`}>
                                    {uploading ? "Uploading..." : label}
                                </p>
                                <p className="text-[11px] text-muted mt-1">
                                    CSV, Excel • Max 50MB
                                </p>
                            </div>

                            {error && (
                                <div className="absolute inset-x-4 bottom-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
                                    {error}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
