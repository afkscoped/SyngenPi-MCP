"use client";

import { useState } from "react";
import { Bot, Send, Loader2 } from "lucide-react";
import { Card } from "./ui/ThemeComponents";
import SpreadsheetEditor from "./SpreadsheetEditor";

const API_BASE = "/api/backend";

export default function MLPanel() {
    const [prompt, setPrompt] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);
    const [jobStatus, setJobStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
    const [currentDataset, setCurrentDataset] = useState<{ name: string, url: string } | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSendMessage = async () => {
        if (!prompt.trim()) return;

        const userMessage = prompt;
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        setPrompt("");
        setChatLoading(true);

        try {
            if (!currentDataset) {
                if (userMessage.length > 3) {
                    throw new Error("Please upload or load a dataset below first.");
                }
            }

            // Call the Unified Two-Engine Router
            const res = await fetch(`${API_BASE}/ml/agent_interact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataset_id: currentDataset?.name || "", command: userMessage })
            });
            const data = await res.json();

            if (data.error) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.error}` }]);
            } else if (data.action === "MANIPULATION") {
                // Success - Data Edited
                const codeSnippet = data.code ? `\n\`\`\`python\n${data.code}\n\`\`\`` : "";
                setChatHistory(prev => [...prev, { role: 'assistant', content: `✅ Data Updated.\n${codeSnippet}` }]);
                setRefreshTrigger(prev => prev + 1);

            } else if (data.action === "PREDICTION") {
                // Success - Intent identified, start training
                const targetCol = data.target;
                setJobStatus("running");
                setChatHistory(prev => [...prev, { role: 'assistant', content: `Starting AutoGluon training on target: **${targetCol}**... this may take a minute.` }]);

                try {
                    // Call Train Endpoint
                    const trainRes = await fetch(`${API_BASE}/ml/train`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            dataset_id: currentDataset!.name,
                            target: targetCol,
                            time_limit: 30
                        })
                    });
                    const trainData = await trainRes.json();

                    if (trainData.error) {
                        setJobStatus("failed");
                        setChatHistory(prev => [...prev, { role: 'assistant', content: `❌ Training Failed: ${trainData.error}` }]);
                    } else {
                        setJobStatus("completed");
                        const metrics = JSON.stringify(trainData.metrics, null, 2);
                        setChatHistory(prev => [...prev, { role: 'assistant', content: `✅ Training Complete!\nModel ID: ${trainData.model_id}\n\nPerformance:\n${metrics}` }]);
                    }
                } catch (e: any) {
                    setJobStatus("failed");
                    setChatHistory(prev => [...prev, { role: 'assistant', content: `❌ Training Network Error: ${e.message}` }]);
                }

            } else {
                // Unknown or other message
                setChatHistory(prev => [...prev, { role: 'assistant', content: data.message || JSON.stringify(data) }]);
            }
        } catch (e: any) {
            setJobStatus("failed");
            setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 p-6">
            {/* NLP Agent Chat Header */}
            <Card className="flex flex-col gap-4 min-h-[300px] max-h-[40vh]">
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-lg font-display font-bold text-text">AutoML Agent</h2>
                            <p className="text-xs text-muted">
                                {currentDataset
                                    ? `Active Dataset: ${currentDataset.name}`
                                    : "No dataset loaded. Upload standard CSV below."}
                            </p>
                        </div>
                    </div>
                    {jobStatus === "running" && (
                        <div className="flex items-center gap-2 text-xs font-medium text-accent bg-accent/5 px-2 py-1 rounded-full animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Training in progress...
                        </div>
                    )}
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
                    {chatHistory.length === 0 && (
                        <div className="text-center text-muted py-8 opactiy-50">
                            <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>1. Import Data below<br />2. Type "Train on [target_column]"</p>
                        </div>
                    )}
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-accent/10'}`}>
                                {msg.role === 'user' ? <span className="text-xs font-bold text-gray-600">You</span> : <Bot className="w-4 h-4 text-accent" />}
                            </div>
                            <div className={`rounded-xl p-3 text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-text text-white' : 'bg-gray-50 text-text border border-border'}`}>
                                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="relative">
                    <input
                        type="text"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder={currentDataset ? "Type 'Train on target' or 'Delete row...'..." : "Please load a dataset first..."}
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none text-text placeholder:text-muted"
                        disabled={chatLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={chatLoading || !prompt.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
                    >
                        {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </Card>

            {/* Embedded Spreadsheet */}
            <div className="flex-1 min-h-[400px] border border-border rounded-xl overflow-hidden shadow-sm">
                <SpreadsheetEditor onFileLoaded={setCurrentDataset} externalRefresh={refreshTrigger} />
            </div>
        </div>
    );
}
