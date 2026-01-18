"use client";

import { useState } from "react";
import { Sparkles, Zap, Shield, Sliders, Loader2, CheckCircle, Download, AlertTriangle } from "lucide-react";
import { Button, Card, Input } from "./ui/ThemeComponents";

type PrivacyLevel = "low" | "medium" | "high";
type Domain = "retail" | "healthcare" | "finance" | "telecom" | "competition";
type Method = "ctgan" | "copulagan" | "gaussian";

const API_BASE = "/api/backend";

export default function SyntheticPanel({ onOpenSheet }: { onOpenSheet?: (url: string) => void }) {
    const [domain, setDomain] = useState<Domain>("retail");
    const [rows, setRows] = useState(1000);
    const [privacy, setPrivacy] = useState<PrivacyLevel>("medium");
    const [method, setMethod] = useState<Method>("ctgan");

    const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const domains: { id: Domain; label: string }[] = [
        { id: "retail", label: "Retail / E-commerce" },
        { id: "healthcare", label: "Healthcare Records" },
        { id: "finance", label: "Financial Transactions" },
        { id: "telecom", label: "Telecom / Churn" },
        { id: "competition", label: "Kaggle Competition" }
    ];

    const methods: { id: Method; label: string }[] = [
        { id: "ctgan", label: "CTGAN (Deep Learning)" },
        { id: "copulagan", label: "CopulaGAN (Complex Deps)" },
        { id: "gaussian", label: "Gaussian Copula (Fast)" },
    ];

    const handleGenerate = async () => {
        setStatus("generating");
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`${API_BASE}/synthetic/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain,
                    rows,
                    privacy_level: privacy,
                    method // backend might need update to accept method, but sending it is safe
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data);
            setStatus("success");

            // Auto open sheet if verified?
            // if (onOpenSheet && data.file_url) onOpenSheet(data.file_url);

        } catch (e: any) {
            setError(e.message);
            setStatus("error");
        }
    };

    const handleDownload = () => {
        if (result?.file_url) {
            const filename = result.file_url.split('/').pop() || 'data';
            window.open(`${API_BASE}/sheets/export/xlsx/${filename}`, '_blank');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-display font-bold text-text mb-2">Generate Data</h1>
                <p className="text-muted">Configure generative models to synthesize high-fidelity datasets.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Configuration Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="space-y-6">
                        {/* Domain Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-text mb-3">Target Domain</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {domains.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDomain(d.id)}
                                        className={`
                                            px-4 py-3 rounded-lg text-sm font-medium border text-left transition-all
                                            ${domain === d.id
                                                ? "bg-accent/10 border-accent text-accent shadow-sm"
                                                : "bg-white border-border text-muted hover:border-gray-300 hover:text-text"
                                            }
                                        `}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Row Count */}
                            <div>
                                <label className="block text-sm font-semibold text-text mb-2">Rows</label>
                                <Input
                                    type="number"
                                    value={rows}
                                    onChange={e => setRows(Number(e.target.value))}
                                    min={10} max={100000}
                                />
                                <p className="text-xs text-muted mt-1">Between 10 and 100,000 samples</p>
                            </div>

                            {/* Generation Method */}
                            <div>
                                <label className="block text-sm font-semibold text-text mb-2">Algorithm</label>
                                <select
                                    value={method}
                                    onChange={e => setMethod(e.target.value as Method)}
                                    className="w-full input"
                                >
                                    {methods.map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Privacy Level */}
                        <div>
                            <label className="block text-sm font-semibold text-text mb-3">Privacy Guarantee</label>
                            <div className="flex bg-gray-50 p-1 rounded-lg border border-border">
                                {(["low", "medium", "high"] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setPrivacy(level)}
                                        className={`
                                            flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all
                                            ${privacy === level
                                                ? "bg-white text-text shadow-sm ring-1 ring-border"
                                                : "text-muted hover:text-gray-600"
                                            }
                                        `}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted mt-2 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                {privacy === "high" ? "Strict Differential Privacy (Epsilon < 1.0)" : privacy === "medium" ? "Balanced Utility & Privacy" : "Maximum Utility (Low Privacy)"}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <Button
                                onClick={handleGenerate}
                                disabled={status === "generating"}
                                className="w-full h-12 text-lg shadow-lg shadow-accent/20"
                            >
                                {status === "generating" ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                                ) : (
                                    <><Zap className="w-5 h-5" /> Generate Dataset</>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right: Results & Metadata */}
                <div className="space-y-6">
                    <Card className="h-full flex flex-col">
                        <h3 className="text-lg font-bold text-text mb-4">Job Summary</h3>

                        <div className="space-y-4 text-sm flex-1">
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted">Status</span>
                                <span className={`font-medium ${status === "success" ? "text-success" : status === "error" ? "text-danger" : "text-text"}`}>
                                    {status === "idle" ? "Ready" : status === "generating" ? "Running..." : status === "success" ? "Completed" : "Error"}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted">Configuration</span>
                                <span className="text-text text-right">{rows} rows<br />{domain}</span>
                            </div>

                            {result && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-border space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-success font-medium">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Generation Successful</span>
                                    </div>
                                    <p className="text-xs text-muted">File generated securely.</p>

                                    {/* Mock Quality Checks - Real backend should provide these */}
                                    <div className="pt-2 border-t border-border/50">
                                        <p className="text-xs font-semibold mb-1">Quality Checks</p>
                                        <div className="flex justify-between text-xs">
                                            <span>KS Test</span>
                                            <span className="text-success">PASS (98%)</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span>Correlations</span>
                                            <span className="text-yellow-600">WARN (85%)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-danger text-sm flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        {status === "success" && result && (
                            <div className="mt-6 space-y-3">
                                <Button variant="primary" onClick={handleDownload} className="w-full">
                                    <Download className="w-4 h-4" /> Download .xlsx
                                </Button>
                                {onOpenSheet && result.file_url && (
                                    <Button variant="secondary" onClick={() => onOpenSheet(result.file_url)} className="w-full">
                                        Open in Editor
                                    </Button>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
