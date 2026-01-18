import { useState, useEffect, useRef, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-alpine.css"; // Keep theme, remove base if causing conflict, or use legacy
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule } from "ag-grid-community";
import { Button } from "./ui/ThemeComponents";
import { Save, Download, Upload, Undo, Redo, RefreshCw } from "lucide-react";
import FileDropZone from "./FileDropZone";

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

const API_BASE = "/api/backend";

interface SpreadsheetEditorProps {
    onFileLoaded?: (file: { name: string; url: string }) => void;
    externalRefresh?: number;
}

export default function SpreadsheetEditor({ onFileLoaded, externalRefresh }: SpreadsheetEditorProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [rowData, setRowData] = useState<any[]>([]);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const [loading, setLoading] = useState(false);
    const [filename, setFilename] = useState<string | null>(null);

    // Load from localStorage on mount or refresh trigger
    useEffect(() => {
        // If externalRefresh changed and we have a filename, reload from server
        if (externalRefresh && externalRefresh > 0 && filename) {
            loadData(filename); // filename or url? loadData expects url (which serves as key/filename)
            return;
        }

        const savedData = localStorage.getItem("mcp_spreadsheet_data");
        const savedFilename = localStorage.getItem("mcp_spreadsheet_filename");
        const savedCols = localStorage.getItem("mcp_spreadsheet_cols");

        if (savedData && savedFilename) {
            try {
                setRowData(JSON.parse(savedData));
                setFilename(savedFilename);
                if (savedCols) {
                    setColumnDefs(JSON.parse(savedCols));
                }
            } catch (e) {
                console.error("Failed to load saved state", e);
                localStorage.removeItem("mcp_spreadsheet_data");
            }
        }
    }, []);

    // Save to localStorage whenever data changes (debounced/on-edit)
    const persistState = (newRows: any[], newFilename: string, newCols: ColDef[]) => {
        localStorage.setItem("mcp_spreadsheet_data", JSON.stringify(newRows));
        localStorage.setItem("mcp_spreadsheet_filename", newFilename);
        localStorage.setItem("mcp_spreadsheet_cols", JSON.stringify(newCols));
    };

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

            let newCols: ColDef[] = [];
            if (data.columns) {
                newCols = data.columns.map((c: any) => ({
                    field: c.key,
                    headerName: c.name,
                    editable: true,
                    resizable: true,
                    sortable: true,
                    filter: true,
                    minWidth: 120
                }));
            } else if (data.rows && data.rows.length > 0) {
                const keys = Object.keys(data.rows[0]);
                newCols = keys.map(k => ({
                    field: k,
                    headerName: k,
                    editable: true,
                    resizable: true,
                    sortable: true,
                    filter: true
                }));
            }

            setColumnDefs(newCols);
            setRowData(data.rows || []);

            // Persist immediately
            persistState(data.rows || [], filename || "data.csv", newCols);

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
            // Update local storage too
            persistState(rows, filename, columnDefs);
        } catch (e) {
            console.error("Save error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCellDetailsChanged = (event: any) => {
        // Capture edits
        const rows: any[] = [];
        event.api.forEachNode((node: any) => rows.push(node.data));
        setRowData(rows);
        if (filename) persistState(rows, filename, columnDefs);
    };

    const exportCsv = () => {
        gridRef.current?.api.exportDataAsCsv({
            fileName: filename?.replace(/\.[^/.]+$/, "") || "export"
        });
    };

    const clearSession = () => {
        localStorage.removeItem("mcp_spreadsheet_data");
        localStorage.removeItem("mcp_spreadsheet_filename");
        localStorage.removeItem("mcp_spreadsheet_cols");
        setRowData([]);
        setFilename(null);
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
                            {/* AI Command Bar */}
                            <div className="flex items-center mr-4 bg-gray-50 border border-input rounded-md px-3 py-1.5 w-80">
                                <span className="text-xs font-bold text-accent mr-2">AI</span>
                                <input
                                    className="bg-transparent border-none text-sm w-full focus:outline-none"
                                    placeholder="e.g. 'Delete rows where Age < 20'..."
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            const cmd = e.currentTarget.value;
                                            if (!cmd.trim()) return;
                                            setLoading(true);
                                            try {
                                                const res = await fetch(`${API_BASE}/sheets/agent-edit`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ url: filename, command: cmd })
                                                });
                                                const data = await res.json();
                                                if (data.error) throw new Error(data.error);

                                                // Update Grid
                                                if (data.rows) {
                                                    setRowData(data.rows);
                                                    persistState(data.rows, filename, columnDefs);
                                                }
                                                // Update Cols if changed
                                                if (data.columns) {
                                                    const newCols = data.columns.map((c: any) => ({
                                                        field: c.key,
                                                        headerName: c.name,
                                                        editable: true,
                                                        resizable: true,
                                                        sortable: true,
                                                        filter: true,
                                                        minWidth: 120
                                                    }));
                                                    setColumnDefs(newCols);
                                                }
                                                e.currentTarget.value = ""; // clear
                                            } catch (err) {
                                                console.error(err);
                                                alert("AI Error: " + err);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                />
                            </div>

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
                            <Button variant="ghost" onClick={clearSession} title="Clear Session">
                                <RefreshCw className="w-4 h-4 text-muted" />
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
                            onCellValueChanged={handleCellDetailsChanged}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
