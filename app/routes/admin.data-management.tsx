"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Download, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function meta() {
  return [
    { title: "Data Management - Admin - TagMe Connections" },
    { name: "description", content: "Export and import all application data for backup or migration." },
  ];
}

export function handle() {
  return {
    breadcrumb: { label: "Data Management" },
  };
}

type Status = { type: "idle" } | { type: "loading" } | { type: "success"; message: string } | { type: "error"; message: string };

export default function DataManagement() {
  const [exportStatus, setExportStatus] = useState<Status>({ type: "idle" });
  const [importStatus, setImportStatus] = useState<Status>({ type: "idle" });
  const [importMode, setImportMode] = useState<"upsert" | "replace">("upsert");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExportStatus({ type: "loading" });
    try {
      const response = await fetch("/.netlify/functions/export-data");
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.details || err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.href = url;
      a.download = `tagme-export-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const { counts } = data;
      setExportStatus({
        type: "success",
        message: `Exported: ${counts.customers} customers, ${counts.orders} orders, ${counts.cards} cards, ${counts.card_assets} assets, ${counts.admin_users} admin users.`,
      });
    } catch (error) {
      setExportStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Export failed",
      });
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setImportStatus({ type: "error", message: "Please select a JSON file to import." });
      return;
    }

    setImportStatus({ type: "loading" });
    try {
      const text = await file.text();
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file. Please select a valid export file.");
      }

      const response = await fetch(`/.netlify/functions/import-data?mode=${importMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.details || result.error || `HTTP ${response.status}`);
      }

      const { counts } = result;
      setImportStatus({
        type: "success",
        message: `Imported (${importMode}): ${counts.customers} customers, ${counts.orders} orders, ${counts.cards} cards, ${counts.card_assets} assets, ${counts.admin_users} admin users.`,
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setImportStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Management</h1>
        <p className="text-muted-foreground mt-2">
          Export a full backup or import data into a fresh app instance.
        </p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download all customers, orders, cards, card assets, and admin users as a single JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleExport}
            disabled={exportStatus.type === "loading"}
            data-testid="export-button"
          >
            {exportStatus.type === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {exportStatus.type === "loading" ? "Exporting…" : "Export All Data"}
          </Button>

          {exportStatus.type === "success" && (
            <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800" data-testid="export-success">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{exportStatus.message}</span>
            </div>
          )}
          {exportStatus.type === "error" && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800" data-testid="export-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{exportStatus.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Restore from a previously exported JSON file. Use <strong>Upsert</strong> to merge records
            or <strong>Replace</strong> to clear all existing data first (destructive).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Import Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="upsert"
                    checked={importMode === "upsert"}
                    onChange={() => setImportMode("upsert")}
                    data-testid="mode-upsert"
                  />
                  <span className="text-sm">Upsert (merge — safe)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    data-testid="mode-replace"
                  />
                  <span className="text-sm text-red-600">Replace (destructive — clears all data first)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="import-file">
                Export File (.json)
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json,application/json"
                ref={fileInputRef}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                data-testid="import-file-input"
              />
            </div>

            <Button
              type="submit"
              disabled={importStatus.type === "loading"}
              variant={importMode === "replace" ? "destructive" : "default"}
              data-testid="import-button"
            >
              {importStatus.type === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {importStatus.type === "loading" ? "Importing…" : "Import Data"}
            </Button>

            {importStatus.type === "success" && (
              <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800" data-testid="import-success">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{importStatus.message}</span>
              </div>
            )}
            {importStatus.type === "error" && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800" data-testid="import-error">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{importStatus.message}</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
