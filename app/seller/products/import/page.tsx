// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { AuthGuard } from "@/components/somago/auth-guard";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface ParsedProduct {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  error?: string;
}

interface ImportResult {
  index: number;
  success: boolean;
  error?: string;
  id?: string;
}

export default function SellerProductImportPage() {
  return (
    <AuthGuard message="Please sign in to import products." requiredRole="seller">
      <SellerProductImportContent />
    </AuthGuard>
  );
}

function SellerProductImportContent() {
  const categories = useQuery(api.categories.list);
  const bulkCreate = useMutation(api.products.bulkCreate);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (categories === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  const categoryMap = new Map<string, string>();
  categories.forEach((cat) => {
    categoryMap.set(cat.name.toLowerCase(), cat._id);
  });

  // Split CSV text into logical rows (handles quoted newlines)
  function splitCSVRows(text: string): string[] {
    const rows: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        current += ch;
      } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && text[i + 1] === "\n") i++; // skip \r\n
        if (current.trim()) rows.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) rows.push(current);
    return rows;
  }

  function parseCSV(text: string): ParsedProduct[] {
    const lines = splitCSVRows(text);
    if (lines.length < 2) {
      toast.error("CSV must have a header row and at least one data row");
      return [];
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const nameIdx = header.findIndex((h) => h === "name");
    const descIdx = header.findIndex((h) => h === "description");
    const catIdx = header.findIndex((h) => h === "category");
    const priceIdx = header.findIndex((h) => h === "price");
    const stockIdx = header.findIndex((h) => h === "stock");
    const imgIdx = header.findIndex((h) => h === "imageurl" || h === "image_url" || h === "image");

    if (nameIdx === -1 || descIdx === -1 || catIdx === -1 || priceIdx === -1 || stockIdx === -1) {
      toast.error("CSV must have columns: name, description, category, price, stock. Optional: imageUrl");
      return [];
    }

    const rows: ParsedProduct[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const name = cols[nameIdx]?.trim() ?? "";
      const description = cols[descIdx]?.trim() ?? "";
      const category = cols[catIdx]?.trim() ?? "";
      const price = parseFloat(cols[priceIdx]?.trim() ?? "");
      const stock = parseInt(cols[stockIdx]?.trim() ?? "", 10);
      const imageUrl = imgIdx >= 0 ? (cols[imgIdx]?.trim() ?? "") : "";

      let error: string | undefined;
      if (!name) error = "Missing name";
      else if (!description) error = "Missing description";
      else if (!category) error = "Missing category";
      else if (isNaN(price) || price <= 0) error = "Invalid price";
      else if (isNaN(stock) || stock < 0) error = "Invalid stock";
      else if (!categoryMap.has(category.toLowerCase())) error = `Unknown category: "${category}"`;

      rows.push({ name, description, category, price: isNaN(price) ? 0 : price, stock: isNaN(stock) ? 0 : stock, imageUrl, error });
    }

    return rows;
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          result.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFileName(file.name);
    setResults([]);
    setShowResults(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setParsedRows(parsed);
    };
    reader.readAsText(file);
  };

  const validRows = parsedRows.filter((r) => !r.error);
  const errorRows = parsedRows.filter((r) => r.error);

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    setShowResults(false);
    const allResults: ImportResult[] = [];

    // Batch in groups of 50
    const batches: ParsedProduct[][] = [];
    for (let i = 0; i < validRows.length; i += 50) {
      batches.push(validRows.slice(i, i + 50));
    }

    setProgress({ done: 0, total: validRows.length });

    for (const batch of batches) {
      try {
        const batchData = batch.map((row) => ({
          name: row.name,
          description: row.description,
          categoryId: categoryMap.get(row.category.toLowerCase())! as any,
          price: row.price,
          stock: row.stock,
          imageUrl: row.imageUrl || undefined,
        }));

        const batchResults = await bulkCreate({ products: batchData });
        allResults.push(...batchResults);
        setProgress((prev) => ({ ...prev, done: prev.done + batch.length }));
      } catch (e: any) {
        // Mark all rows in failed batch as errors
        batch.forEach((_, idx) => {
          allResults.push({
            index: allResults.length + idx,
            success: false,
            error: e.message || "Batch failed",
          });
        });
        setProgress((prev) => ({ ...prev, done: prev.done + batch.length }));
      }
    }

    setResults(allResults);
    setShowResults(true);
    setImporting(false);

    const successCount = allResults.filter((r) => r.success).length;
    const failCount = allResults.filter((r) => !r.success).length;

    if (failCount === 0) {
      toast.success(`Successfully imported ${successCount} products!`);
    } else {
      toast.warning(`Imported ${successCount} products, ${failCount} failed.`);
    }
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName("");
    setResults([]);
    setShowResults(false);
    setProgress({ done: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Import Products (CSV)</h1>
        {parsedRows.length > 0 && (
          <Button variant="outline" onClick={handleReset}>
            Clear
          </Button>
        )}
      </div>

      {/* File Upload */}
      {parsedRows.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="mb-1 text-sm font-medium text-neutral-900">Upload your CSV file</p>
          <p className="mb-4 text-xs text-neutral-500">
            Required columns: name, description, category, price, stock. Optional: imageUrl
          </p>
          <label className="inline-block cursor-pointer">
            <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => fileInputRef.current?.click()}>
              Choose CSV File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && !showResults && (
        <>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Preview: {fileName}
                </p>
                <p className="text-xs text-neutral-500">
                  {validRows.length} valid, {errorRows.length} with errors, {parsedRows.length} total rows
                </p>
              </div>
              {errorRows.length > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">{errorRows.length} errors</Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-neutral-500">
                    <th className="pb-2 pr-3 font-medium">#</th>
                    <th className="pb-2 pr-3 font-medium">Name</th>
                    <th className="pb-2 pr-3 font-medium">Description</th>
                    <th className="pb-2 pr-3 font-medium">Category</th>
                    <th className="pb-2 pr-3 font-medium">Price</th>
                    <th className="pb-2 pr-3 font-medium">Stock</th>
                    <th className="pb-2 pr-3 font-medium">Image</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border/50 ${row.error ? "bg-red-50" : ""}`}
                    >
                      <td className="py-2 pr-3 text-neutral-400">{i + 1}</td>
                      <td className="py-2 pr-3 max-w-[120px] truncate font-medium text-neutral-900">{row.name || "—"}</td>
                      <td className="py-2 pr-3 max-w-[150px] truncate text-neutral-600">{row.description || "—"}</td>
                      <td className="py-2 pr-3 text-neutral-600">{row.category || "—"}</td>
                      <td className="py-2 pr-3 text-neutral-900">₱{row.price.toLocaleString()}</td>
                      <td className="py-2 pr-3 text-neutral-600">{row.stock}</td>
                      <td className="py-2 pr-3 max-w-[100px] truncate text-neutral-400">
                        {row.imageUrl || "—"}
                      </td>
                      <td className="py-2">
                        {row.error ? (
                          <Badge className="bg-red-100 text-red-800 text-[10px]">{row.error}</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 text-[10px]">Valid</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Button */}
          <div className="flex items-center gap-3">
            <Button
              className="bg-primary-600 hover:bg-primary-700"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
            >
              {importing ? "Importing..." : `Import ${validRows.length} Products`}
            </Button>
            {importing && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all"
                    style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-500">
                  {progress.done}/{progress.total}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Import Results */}
      {showResults && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-neutral-900">Import Results</h2>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                {results.filter((r) => r.success).length} succeeded
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                {results.filter((r) => !r.success).length} failed
              </span>
            </div>

            {results.some((r) => !r.success) && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-red-700">Failed rows:</p>
                {results
                  .filter((r) => !r.success)
                  .map((r) => (
                    <p key={r.index} className="text-xs text-red-600">
                      Row {r.index + 1}: {r.error}
                    </p>
                  ))}
              </div>
            )}
          </div>

          <Button variant="outline" onClick={handleReset}>
            Import Another File
          </Button>
        </div>
      )}

      {/* Instructions */}
      {parsedRows.length === 0 && !showResults && (
        <div className="rounded-lg border border-border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-neutral-900">CSV Format</h2>
          <p className="mb-2 text-xs text-neutral-500">Your CSV file should have these columns:</p>
          <div className="overflow-x-auto rounded bg-neutral-50 p-3">
            <code className="text-xs text-neutral-700">
              name,description,category,price,stock,imageUrl
              <br />
              &quot;Wireless Mouse&quot;,&quot;Ergonomic bluetooth mouse&quot;,Electronics,499,50,https://example.com/mouse.jpg
              <br />
              &quot;Phone Case&quot;,&quot;Slim protective case&quot;,Accessories,199,100,
            </code>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Available categories: {categories.map((c) => c.name).join(", ") || "None yet"}
          </p>
        </div>
      )}
    </div>
  );
}
