"use client";

import { useState } from "react";
import { Beaker, Upload, Database, Repeat, Play, Loader2, AlertCircle, BarChart3, ArrowRight, Table } from "lucide-react";
import { Button, Card, Input } from "./ui/ThemeComponents";
import FileDropZone from "./FileDropZone";

const API_BASE = "/api/backend";

type Mode = "syngen" | "kaggle" | "upload";

export default function MetaPanel() {
    const [mode, setMode] = useState<Mode>("syngen");
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, url: string }>>([]);

    const [synDomain, setSynDomain] = useState("saas");
    const [synN, setSynN] = useState(20);
    const [synEffect, setSynEffect] = useState(0.05);

    const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
    const [summaries, setSummaries] = useState<any[]>([]);
    const [metaResult, setMetaResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileAdded = (file: { name: string, url: string }) => {
        setUploadedFiles(prev => [...prev, file]);
    };

    const handleRunSyngen = async () => {
        setStatus("running");
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/meta/syngen`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ n_studies: synN, domain: synDomain, effect_size: synEffect, heterogeneity: 0.01 })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSummaries(data.summaries || []);
            setMetaResult(data);
            setStatus("done");
        } catch (e: any) {
            setError(e.message);
            setStatus("error");
        }
    };

    const handleRunUpload = async () => {
        if (uploadedFiles.length === 0) return;
        setStatus("running");
        setError(null);
        try {
            const fileIds = uploadedFiles.map(f => f.url.split("/").pop() || f.name);
            const prepRes = await fetch(`${API_BASE}/meta/prepare`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: fileIds })
            });
            const prepData = await prepRes.json();
            if (prepData.error) throw new Error(prepData.error);
            setSummaries(prepData.summaries);

            const runRes = await fetch(`${API_BASE}/meta/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summaries: prepData.summaries, method: "random" })
            });
            const runData = await runRes.json();
            if (runData.error) throw new Error(runData.error);
            setMetaResult(runData);
            setStatus("done");
        } catch (e: any) {
            setError(e.message);
            setStatus("error");
        }
    };

    const modes = [
        { id: "syngen", label: "Simulation Loop", icon: Repeat },
        { id: "kaggle", label: "Kaggle Repo", icon: Database },
        { id: "upload", label: "Local Files", icon: Upload },
    ] as const;

    return (
        <div className="h-full flex flex-col p-6 gap-6 max-w-6xl mx-auto">
            <header>
                <h1 className="text-3xl font-display font-bold text-text mb-2 flex items-center gap-3">
                    <Beaker className="w-8 h-8 text-accent" />
                    Meta-Scientist
                </h1>
                <p className="text-muted">Synthesize evidence from multiple disparate sources into a unified effect size.</p>
            </header>

            {/* Mode Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-fit border border-border">
                {modes.map(m => (
                    <button
                        key={m.id}
                        onClick={() => { setMode(m.id); setSummaries([]); setMetaResult(null); setStatus("idle"); }}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
                            ${mode === m.id
                                ? "bg-white text-text shadow-sm border border-border/50"
                                : "text-muted hover:text-text hover:bg-white/50"
                            }
                        `}
                    >
                        <m.icon className={`w-4 h-4 ${mode === m.id ? 'text-accent' : ''}`} />
                        {m.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Config Panel */}
                <div className="lg:col-span-5">
                    <Card className="h-full">
                        <h3 className="text-lg font-bold text-text mb-6">Configuration</h3>

                        {mode === "syngen" && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">Research Domain</label>
                                        <select
                                            value={synDomain}
                                            onChange={e => setSynDomain(e.target.value)}
                                            className="w-full input"
                                        >
                                            <option value="saas">SaaS Pricing Experiments</option>
                                            <option value="ecommerce">E-Commerce Conversion</option>
                                            <option value="medical">Medical Clinical Trials</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">Hypothesized Effect Size</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={synEffect}
                                            onChange={e => setSynEffect(Number(e.target.value))}
                                        />
                                        <p className="text-xs text-muted mt-1">Cohen's d or Log Odds Ratio</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">Number of Studies</label>
                                        <Input
                                            type="number"
                                            value={synN}
                                            onChange={e => setSynN(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleRunSyngen}
                                    disabled={status === "running"}
                                    className="w-full h-12 text-lg shadow-lg shadow-accent/20"
                                >
                                    {status === "running" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                    Run Simulation
                                </Button>
                            </div>
                        )}

                        {mode === "upload" && (
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 border border-border rounded-xl">
                                    <FileDropZone onFileUploaded={handleFileAdded} label="Drop A/B test result files" />
                                </div>
                                {uploadedFiles.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-semibold text-muted uppercase">Ready to Analyze</p>
                                        {uploadedFiles.map((f, i) => (
                                            <div key={i} className="px-3 py-2 bg-white border border-border rounded-lg text-sm text-text flex items-center gap-2 shadow-sm">
                                                <Table className="w-4 h-4 text-accent" />
                                                {f.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Button
                                    onClick={handleRunUpload}
                                    disabled={status === "running" || uploadedFiles.length === 0}
                                    className="w-full h-12 text-lg"
                                >
                                    {status === "running" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                    Meta-Analyze Files
                                </Button>
                            </div>
                        )}

                        {mode === "kaggle" && (
                            <div className="text-center py-12 flex flex-col items-center opacity-60">
                                <Database className="w-16 h-16 text-gray-300 mb-4" />
                                <h4 className="text-text font-bold mb-1">Kaggle Integration</h4>
                                <p className="text-sm text-muted max-w-[200px]">
                                    Requires API key configuration in environment variables.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-7 space-y-6">
                    {summaries.length > 0 && (
                        <div className="h-full flex flex-col gap-6">
                            {/* Forest Plot Summary */}
                            {metaResult && !metaResult.error && (
                                <Card className="bg-gradient-to-br from-accent to-accent2 text-white border-transparent relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-white/80 font-medium">Weighted Mean Effect</h4>
                                                <p className="text-4xl font-bold tracking-tight mt-1">{metaResult.pooled_effect?.toFixed(4)}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium inline-block mb-1">
                                                    I² = {metaResult.i2?.toFixed(1)}% (Heterogeneity)
                                                </div>
                                                <p className="text-sm text-white/70">p &lt; {metaResult.p_value?.toExponential(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                                </Card>
                            )}

                            <Card className="flex-1 flex flex-col min-h-[400px]">
                                <h3 className="text-lg font-bold text-text mb-4">Study Summaries</h3>
                                <div className="flex-1 overflow-auto -mx-6 px-6 relative">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-white z-10 border-b border-border text-left">
                                            <tr>
                                                <th className="pb-3 font-semibold text-muted">Study ID</th>
                                                <th className="pb-3 font-semibold text-muted text-right">P-Value</th>
                                                <th className="pb-3 font-semibold text-muted text-right">Effect Size</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {summaries.filter(s => !s.error).map((s, i) => (
                                                <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 font-mono text-text">{s.study_id.substring(0, 8)}</td>
                                                    <td className="py-3 text-right text-muted">{s.p_value?.toFixed(3)}</td>
                                                    <td className={`py-3 text-right font-mono font-medium ${(s.effect_size || 0) > 0 ? "text-success" : "text-danger"}`}>
                                                        {s.effect_size?.toFixed(3)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {summaries.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted border-2 border-dashed border-border rounded-xl bg-gray-50/50">
                            <Beaker className="w-16 h-16 opacity-10 mb-4" />
                            <h4 className="text-lg font-bold text-gray-400">No Analysis Results</h4>
                            <p className="max-w-xs mx-auto mt-2">Run a simulation or upload studies to see the meta-analysis forest plot data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
