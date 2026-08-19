import { useState, useRef, useCallback } from "react";

const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileIcon = (type) => {
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  if (type === "application/pdf") return "📄";
  if (type.includes("zip") || type.includes("rar")) return "🗜️";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("sheet") || type.includes("excel")) return "📊";
  return "📁";
};

function FileRow({ f, onRemove }) {
  return (
    <div style={s.fileRow}>
      <span style={s.fileEmoji}>{getFileIcon(f.type)}</span>
      <div style={s.fileDetails}>
        <div style={s.fileTopRow}>
          <span style={s.fileName}>{f.name}</span>
          <span style={s.fileSize}>{formatSize(f.size)}</span>
        </div>
        <div style={s.track}>
          <div
            style={{
              ...s.fill,
              width: `${f.progress}%`,
              background:
                f.status === "done" ? "#22c55e"
                : f.status === "error" ? "#ef4444"
                : "#38bdf8",
            }}
          />
        </div>
        <div style={s.fileBottomRow}>
          <span style={{
            ...s.statusLabel,
            color:
              f.status === "done" ? "#16a34a"
              : f.status === "error" ? "#dc2626"
              : f.status === "uploading" ? "#0284c7"
              : "#94a3b8",
          }}>
            {f.status === "waiting" && "Waiting..."}
            {f.status === "uploading" && `Uploading...`}
            {f.status === "done" && "✓ Upload complete"}
            {f.status === "error" && "✗ Upload failed"}
          </span>
          <span style={s.fileTypeTag}>
            {f.type.split("/")[1]?.toUpperCase() || "FILE"}
          </span>
        </div>
      </div>
      {f.status !== "uploading" && (
        <button style={s.removeBtn} onClick={() => onRemove(f.id)}>✕</button>
      )}
    </div>
  );
}

export default function UploadModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState("file");
  const inputRef = useRef();
  const folderInputRef = useRef();

  // ── Real upload to backend ───────────────────
  const uploadFile = async (id, fileObject) => {
    const token = localStorage.getItem("token");

    // Set status to uploading
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "uploading", progress: 30 } : f))
    );

    try {
      const formData = new FormData();
      formData.append("file", fileObject);

      const res = await fetch("http://localhost:5000/api/files/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Upload failed
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: "error", progress: 0 } : f))
        );
        return;
      }

      // Upload succeeded
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "done", progress: 100 } : f))
      );

    } catch (err) {
      console.error("Upload error:", err);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "error", progress: 0 } : f))
      );
    }
  };

  const addFiles = useCallback((incoming) => {
    const newFiles = Array.from(incoming).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      progress: 0,
      status: "waiting",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    // Start uploading each file immediately
    newFiles.forEach((f) => uploadFile(f.id, f.file));
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const doneCount = files.filter((f) => f.status === "done").length;
  const allDone = files.length > 0 && doneCount === files.length;

  return (
    <>
      <div style={s.backdrop} onClick={onClose} />
      <div style={s.modal}>

        <div style={s.header}>
          <div>
            <h2 style={s.title}>Upload to Drive</h2>
            <p style={s.subtitle}>Add files or folders to your drive</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === "file" ? s.tabActive : {}) }}
            onClick={() => setTab("file")}
          >
            📄 Upload File
          </button>
          <button
            style={{ ...s.tab, ...(tab === "folder" ? s.tabActive : {}) }}
            onClick={() => setTab("folder")}
          >
            📁 Upload Folder
          </button>
        </div>

        <div
          style={{ ...s.dropzone, ...(dragging ? s.dropzoneDragging : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() =>
            tab === "file" ? inputRef.current.click() : folderInputRef.current.click()
          }
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory="true"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />

          <div style={s.dropIcon}>
            {dragging ? "⬇️" : tab === "folder" ? "📁" : "☁️"}
          </div>
          <p style={s.dropTitle}>
            {dragging ? "Release to upload"
              : tab === "folder" ? "Drop a folder here"
              : "Drag & drop files here"}
          </p>
          <p style={s.dropSub}>or</p>
          <button
            style={s.browseBtn}
            onClick={(e) => {
              e.stopPropagation();
              tab === "file" ? inputRef.current.click() : folderInputRef.current.click();
            }}
          >
            Browse {tab === "folder" ? "Folder" : "Files"}
          </button>
          <p style={s.dropHint}>Any file type · Images, PDFs, Videos, Docs...</p>
        </div>

        {files.length > 0 && (
          <div style={s.fileList}>
            <div style={s.listHeader}>
              <span style={s.listHeaderText}>
                {files.length} file{files.length > 1 ? "s" : ""} ·{" "}
                <span style={{ color: "#16a34a" }}>{doneCount} done</span>
              </span>
              <button style={s.clearAll} onClick={() => setFiles([])}>
                Clear all
              </button>
            </div>
            <div style={s.scrollList}>
              {files.map((f) => (
                <FileRow key={f.id} f={f} onRemove={removeFile} />
              ))}
            </div>
          </div>
        )}

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            style={{
              ...s.uploadBtn,
              ...(allDone ? s.uploadBtnDone : {}),
              opacity: files.length === 0 ? 0.45 : 1,
              cursor: files.length === 0 ? "not-allowed" : "pointer",
            }}
            disabled={files.length === 0}
            onClick={allDone ? onClose : undefined}
          >
            {allDone ? "✓ Done" : `Upload${files.length > 0 ? ` (${files.length})` : ""}`}
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

const s = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    backdropFilter: "blur(3px)",
    zIndex: 100,
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 101,
    background: "#ffffff",
    borderRadius: 16,
    width: "min(80%, 94vw)",
    maxHeight: "88vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
    overflow: "hidden",
    animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px 0",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: "#94a3b8",
    margin: "3px 0 0",
  },
  closeBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 13,
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    display: "flex",
    gap: 8,
    padding: "16px 24px 0",
  },
  tab: {
    flex: 1,
    padding: "9px 0",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  tabActive: {
    background: "#eff6ff",
    borderColor: "#38bdf8",
    color: "#0284c7",
    fontWeight: 600,
  },
  dropzone: {
    margin: "16px 24px",
    border: "2px dashed #cbd5e1",
    borderRadius: 12,
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    background: "#f8fafc",
    transition: "all 0.2s",
  },
  dropzoneDragging: {
    border: "2px dashed #38bdf8",
    background: "#f0f9ff",
  },
  dropIcon: { fontSize: 36, marginBottom: 4 },
  dropTitle: { fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 },
  dropSub: { fontSize: 12, color: "#94a3b8", margin: 0 },
  browseBtn: {
    background: "#38bdf8",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  dropHint: { fontSize: 11, color: "#cbd5e1", margin: "4px 0 0" },
  fileList: { borderTop: "1px solid #f1f5f9" },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 24px 8px",
  },
  listHeaderText: { fontSize: 12, color: "#64748b", fontWeight: 500 },
  clearAll: {
    background: "none",
    border: "none",
    fontSize: 12,
    color: "#94a3b8",
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  scrollList: {
    maxHeight: 220,
    overflowY: "auto",
    padding: "0 24px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  fileRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: "#f8fafc",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    animation: "rowIn 0.2s ease both",
  },
  fileEmoji: { fontSize: 22, flexShrink: 0 },
  fileDetails: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  fileTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  fileName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  fileSize: { fontSize: 11, color: "#94a3b8", flexShrink: 0 },
  track: { height: 3, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99, transition: "width 0.18s ease" },
  fileBottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: { fontSize: 11, fontWeight: 500 },
  fileTypeTag: {
    fontSize: 10,
    color: "#cbd5e1",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    padding: "1px 6px",
    letterSpacing: "0.04em",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#cbd5e1",
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
    padding: "0 2px",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "14px 24px 20px",
    borderTop: "1px solid #f1f5f9",
    marginTop: "auto",
  },
  cancelBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  uploadBtn: {
    background: "#38bdf8",
    border: "none",
    borderRadius: 8,
    padding: "9px 24px",
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    transition: "all 0.2s",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  uploadBtnDone: { background: "#22c55e" },
};