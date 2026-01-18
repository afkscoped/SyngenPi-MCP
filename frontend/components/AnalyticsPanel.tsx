"use client";

import { useState } from "react";
import { BarChart3, Upload, Send, Loader2, FileSpreadsheet, ListFilter, ArrowRight, MessageSquare, Lightbulb } from "lucide-react";
import { Button, Card, Input } from "./ui/ThemeComponents";
import FileDropZone from "./FileDropZone";
import SpreadsheetEditor from "./SpreadsheetEditor";

const API_BASE = "/api/backend";

export default function AnalyticsPanel() {
    const [datasetUrl, setDatasetUrl] = useState<string | null>(null);
    const [datasetName, setDatasetName] = useState<string>("");
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);

    // When file loaded via DropZone or Editor (if we implemented load there)
    const handleFileUploaded = (file: { name: string; url: string }) => {
        setDatasetUrl(file.url);
        setDatasetName(file.name);
    };

    const handleSendMessage = async (text?: string) => {
        const msg = text || prompt;
        if (!msg.trim() || !datasetUrl) return;

        setChatHistory(prev => [...prev, { role: "user", content: msg }]);
        setPrompt("");
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/analytics/agent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataset_id: datasetUrl, command: msg, sheet: "data" })
            });

            const data = await res.json();

            let response = "";
            if (data.error) {
                response = `❌ Error: ${data.error}`;
            } else if (data.results) {
                response = `📊 **${data.plan?.test || "Analysis"} Results**\n\n`;
                if (data.results.p_value !== undefined) {
                    response += `• P-Value: ${data.results.p_value.toFixed(4)}\n`;
                    response += `• ${data.results.significant ? "✅ Significant" : "⚪ Not significant"}\n`;
                }
                if (data.results.correlation !== undefined) {
                    response += `• Correlation: ${data.results.correlation.toFixed(3)}\n`;
                }
                if (data.results.slope !== undefined) {
                    response += `• Slope: ${data.results.slope.toFixed(4)}\n`;
                    response += `• Intercept: ${data.results.intercept.toFixed(4)}\n`;
                    response += `• R-Squared: ${data.results.r_squared.toFixed(4)}\n`;
                }
                if (data.results.meaning) response += `\n${data.results.meaning}`;
            } else {
                response = JSON.stringify(data, null, 2);
            }

            setChatHistory(prev => [...prev, { role: "assistant", content: response }]);
        } catch (e: any) {
            setChatHistory(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 gap-6 max-w-[1600px] mx-auto">
            <header className="shrink-0">
                <h1 className="text-3xl font-display font-bold text-text mb-2 flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-accent" />
                    Stats Agent
                </h1>
                <p className="text-muted">Perform rigorous statistical testing using natural language commands.</p>
            </header>

            {!datasetUrl ? (
                <Card className="flex-1 flex flex-col items-center justify-center py-20 bg-gray-50/50 border-dashed">
                    <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                        <Upload className="w-10 h-10 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-text mb-2">Import Dataset</h3>
                    <p className="text-muted mb-8 text-center max-w-xs">
                        Upload your experimental data (CSV/Excel) to begin statistical interrogation.
                    </p>
                    <div className="w-full max-w-md">
                        <FileDropZone onFileUploaded={handleFileUploaded} />
                    </div>
                </Card>
            ) : (
                <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                    {/* Chat Area - 40% Width */}
                    <Card className="flex-[0.4] flex flex-col overflow-hidden shadow-lg p-0 min-w-[400px]">
                        {/* Header Context */}
                        <div className="px-6 py-4 border-b border-border bg-gray-50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-border shadow-sm">
                                    <FileSpreadsheet className="w-5 h-5 text-accent" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-text truncate max-w-[200px]">{datasetName}</p>
                                    <p className="text-xs text-muted flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Active
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setDatasetUrl(null); setChatHistory([]); }}>
                                Change
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
                            {chatHistory.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-4">
                                    <ListFilter className="w-12 h-12 text-gray-300 mb-3" />
                                    <p className="text-md font-medium text-gray-400">Ready to analyze</p>
                                    <p className="text-xs text-gray-300 mt-2">Try: "Is there a correlation between A and B?"</p>
                                </div>
                            )}

                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-gray-100" : "bg-accent/10"}`}>
                                        {msg.role === "user" ? <span className="text-xs font-bold text-gray-500">You</span> : <BarChart3 className="w-4 h-4 text-accent" />}
                                    </div>
                                    <div className={`p-3 rounded-xl max-w-[90%] text-sm shadow-sm ${msg.role === "user" ? "bg-text text-white rounded-tr-sm" : "bg-gray-50 border border-border text-text rounded-tl-sm"}`}>
                                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-border">
                                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                                    <span className="text-xs text-muted">Running statistical tests...</span>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border bg-gray-50 shrink-0">
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                                    placeholder="Ask your stats question..."
                                    className="flex-1 pl-4 pr-12 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none text-text placeholder:text-muted/70 shadow-sm text-sm"
                                    disabled={loading}
                                />
                                <Button
                                    onClick={() => handleSendMessage()}
                                    disabled={!prompt.trim() || loading}
                                    className="absolute right-1.5 p-2 h-auto aspect-square rounded-lg"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Grid Area - 60% Width */}
                    <div className="flex-[0.6] border border-border rounded-xl overflow-hidden shadow-sm bg-white min-w-[500px]">
                        {/* We reuse the SpreadsheetEditor here for viewing/editing */}
                        <SpreadsheetEditor
                            onFileLoaded={handleFileUploaded}
                        // If we want to support external refresh from stats agent later, we can pass a trigger
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
