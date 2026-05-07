import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileUp, X, Loader2 } from "lucide-react";
import { useUploadDataset } from "../hooks/useDatasets";
import { formatBytes } from "../lib/utils";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();
  const upload = useUploadDataset();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }, []);

  const handleSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) validateAndSet(selected);
  };

  const validateAndSet = (f) => {
    const validExts = [".csv", ".xlsx", ".xls", ".parquet", ".pq"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      alert("Unsupported file type. Please upload CSV, Excel, or Parquet files.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      alert("File exceeds 50MB limit.");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await upload.mutateAsync(formData);
      navigate(`/dataset/${result.id}`);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Upload Dataset
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            CSV, Excel, or Parquet files up to 50MB
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => document.getElementById("file-input").click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls,.parquet,.pq"
            className="hidden"
            onChange={handleSelect}
          />
          <FileUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground mb-1">
            Drag and drop your file here
          </p>
          <p className="text-xs text-muted-foreground">
            or click to browse
          </p>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || upload.isPending}
          className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {upload.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload & Analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}
