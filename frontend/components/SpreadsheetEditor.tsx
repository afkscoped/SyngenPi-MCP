"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule } from "ag-grid-community";
import { Button } from "./ui/ThemeComponents";
import { Save, Download, Upload, Undo, Redo } from "lucide-react";
import FileDropZone from "./FileDropZone";

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

const API_BASE = "/api/backend";

interface SpreadsheetEditorProps {
    onFileLoaded?: (file: { name: string; url: string }) => void;
}

export default function SpreadsheetEditor({ onFileLoaded }: SpreadsheetEditorProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [rowData, setRowData] = useState<any[]>([]);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const [loading, setLoading] = useState(false);
    const [filename, setFilename] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        // Could load default data or check local storage
    }, []);

    const handleFileUploaded = (file: { name: string; url: string }) => {
        setFilename(file.name);
        loadData(file.url);
        if (onFileLoaded) onFileLoaded(file);
    };

    const loadData = async (url: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/sheets/load`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.columns) {
                const cols = data.columns.map((c: any) => ({
                    field: c.key,
                    headerName: c.name,
                    editable: true,
                    resizable: true,
                    sortable: true,
                    filter: true,
                    minWidth: 120
                }));
                setColumnDefs(cols);
            } else if (data.rows && data.rows.length > 0) {
                const keys = Object.keys(data.rows[0]);
                setColumnDefs(keys.map(k => ({
                    field: k,
                    headerName: k,
                    editable: true,
                    resizable: true,
                    sortable: true,
                    filter: true
                })));
            }

            setRowData(data.rows || []);
        } catch (e) {
            console.error("Load error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!filename || !gridRef.current) return;
        gridRef.current.api.stopEditing();

        const rows: any[] = [];
        gridRef.current.api.forEachNode(node => rows.push(node.data));

        setLoading(true);
        try {
            await fetch(`${API_BASE}/sheets/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename, rows })
            });
            // Show success toast?
        } catch (e) {
            console.error("Save error:", e);
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = () => {
        gridRef.current?.api.exportDataAsCsv({
            fileName: filename?.replace(/\.[^/.]+$/, "") || "export"
        });
    };

    // Default column config
    const defaultColDef = useMemo(() => ({
        editable: true,
        sortable: true,
        flex: 1,
        minWidth: 100,
        resizable: true,
    }), []);

    return (
        <div className="h-full flex flex-col bg-bg">
            {/* Toolbar */}
            <div className="h-16 flex items-center justify-between px-6 bg-card border-b border-border shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-display font-semibold text-text">
                        {filename || "Untitled Dataset"}
                    </h2>
                    {rowData.length > 0 && (
                        <span className="text-xs text-muted font-medium px-2 py-1 bg-gray-100 rounded">
                            {rowData.length} rows
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {filename && (
                        <>
                            <Button variant="secondary" onClick={() => gridRef.current?.api.undoCellEditing()} title="Undo">
                                <Undo className="w-4 h-4" />
                            </Button>
                            <Button variant="secondary" onClick={() => gridRef.current?.api.redoCellEditing()} title="Redo">
                                <Redo className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <Button onClick={handleSave} disabled={loading}>
                                <Save className="w-4 h-4" />
                                Save
                            </Button>
                            <Button variant="outline" onClick={exportCsv}>
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-hidden p-6 relative">
                {rowData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-gray-50/50">
                        <div className="bg-white p-8 rounded-xl shadow-soft border border-border max-w-lg w-full text-center">
                            <Upload className="w-12 h-12 text-accent mx-auto mb-4" />
                            <h3 className="text-xl font-display font-bold text-text mb-2">Import Data</h3>
                            <p className="text-muted mb-6">Drag and drop a CSV/Excel file or upload start editing.</p>
                            <FileDropZone onFileUploaded={handleFileUploaded} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full w-full ag-theme-alpine shadow-soft rounded-xl overflow-hidden border border-border bg-white">
                        <AgGridReact
                            ref={gridRef}
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            pagination={true}
                            paginationPageSize={20}
                            undoRedoCellEditing={true}
                            undoRedoCellEditingLimit={20}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
