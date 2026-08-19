import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadModal from "./UploadModal";
import Navbar from "./Navbar";

const typeColors = {
  PDF:  { bg: "#fff7ed", text: "#c2410c" },
  XLSX: { bg: "#f0fdf4", text: "#15803d" },
  PNG:  { bg: "#faf5ff", text: "#7e22ce" },
  DOCX: { bg: "#eff6ff", text: "#1d4ed8" },
  MP4:  { bg: "#fdf2f8", text: "#9d174d" },
  ZIP:  { bg: "#fefce8", text: "#a16207" },
  PPTX: { bg: "#fff1f2", text: "#be123c" },
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return "📁";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "🗜️";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation")) return "📋";
  return "📁";
};

const getType = (mimeType) => {
  if (!mimeType) return "FILE";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLSX";
  if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase();
  if (mimeType.includes("word")) return "DOCX";
  if (mimeType.startsWith("video/")) return "MP4";
  if (mimeType.includes("zip")) return "ZIP";
  if (mimeType.includes("presentation")) return "PPTX";
  return mimeType.split("/")[1]?.toUpperCase() || "FILE";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today, " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Yesterday, " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function Recent() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [sortBy, setSortBy] = useState("modified");
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ── Fetch recent files ───────────────────────
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/"); return; }

        const res = await fetch("http://localhost:5000/api/files/recent", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to fetch"); return; }
        setFiles(data.files);

      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  // ── Move to trash ────────────────────────────
  const moveToTrash = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/files/trash/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Trash error:", err);
    }
  };

  // ── Filter + Sort ────────────────────────────
  const filtered = files
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.mimeType?.localeCompare(b.mimeType);
      return new Date(b.updatedAt) - new Date(a.updatedAt); // modified
    });

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-link { text-decoration: none; }
        .nav-item:hover { background: #e0f2fe !important; color: #0284c7 !important; }
        .file-row:hover { background: #f0f9ff !important; border-color: #bae6fd !important; }
        .sort-btn:hover { background: #e2e8f0 !important; }
        .action-btn:hover { background: #e2e8f0 !important; }
        .create-btn:hover { background: #0ea5e9 !important; }
        .logout-btn:hover { background: #fef2f2 !important; color: #dc2626 !important; }
      `}</style>

      <Navbar />

      <main style={s.main}>
        {/* Search Bar */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search in Drive"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Page Header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Recent</h1>
            <p style={s.pageSubtitle}>Files you've opened or edited lately</p>
          </div>
          <div style={s.fileCount}>
            <span style={s.fileCountNum}>{filtered.length}</span>
            <span style={s.fileCountLabel}> files</span>
          </div>
        </div>

        {/* Table Header */}
        <div style={s.tableHeader}>
          <span style={{ ...s.colHeader, flex: 3 }}>Name</span>
          <span style={{ ...s.colHeader, flex: 1, textAlign: "center" }}>Type</span>
          <span style={{ ...s.colHeader, flex: 2, textAlign: "right" }}>Modified</span>
          <span style={{ width: 96 }} />
        </div>

        {/* Sort Buttons */}
        <div style={s.sortBar}>
          {["modified", "name", "type"].map((opt) => (
            <button
              key={opt}
              className="sort-btn"
              style={{ ...s.sortBtn, ...(sortBy === opt ? s.sortBtnActive : {}) }}
              onClick={() => setSortBy(opt)}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
              {sortBy === opt && <span style={{ marginLeft: 4 }}>↓</span>}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={s.emptyState}>
            <p style={s.emptyTitle}>Loading...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={s.emptyState}>
            <p style={{ ...s.emptyTitle, color: "red" }}>{error}</p>
          </div>
        )}

        {/* File List */}
        {!loading && !error && filtered.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>🕐</div>
            <p style={s.emptyTitle}>No recent files</p>
            <p style={s.emptySubtitle}>Files you open or edit will appear here</p>
          </div>
        ) : (
          <div style={s.fileList}>
            {!loading && filtered.map((f, i) => (
              <div
                key={f._id}
                className="file-row"
                style={{ ...s.fileRow, animationDelay: `${i * 40}ms` }}
                onMouseEnter={() => setHoveredId(f._id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Icon + Name */}
                <div style={{ ...s.nameCell, flex: 3 }}>
                  <div style={{
                    ...s.fileIconWrap,
                    background: typeColors[getType(f.mimeType)]?.bg || "#f8fafc",
                  }}>
                    <span style={s.fileIcon}>{getFileIcon(f.mimeType)}</span>
                  </div>
                  <span style={s.fileName}>{f.name}</span>
                </div>

                {/* Type badge */}
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <span style={{
                    ...s.typeBadge,
                    background: typeColors[getType(f.mimeType)]?.bg || "#f1f5f9",
                    color: typeColors[getType(f.mimeType)]?.text || "#64748b",
                  }}>
                    {getType(f.mimeType)}
                  </span>
                </div>

                {/* Modified */}
                <span style={{ ...s.modifiedText, flex: 2 }}>{formatDate(f.updatedAt)}</span>

                {/* Hover Actions */}
                <div style={{ ...s.actions, opacity: hoveredId === f._id ? 1 : 0 }}>
                  <button className="action-btn" style={s.actionBtn} title="Download"
                    onClick={() => window.open(f.fileUrl, "_blank")}>⬇</button>
                  <button className="action-btn" style={s.actionBtn} title="Share">↗</button>
                  <button className="action-btn" style={{ ...s.actionBtn, color: "#f87171" }}
                    title="Delete" onClick={() => moveToTrash(f._id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
const s = {
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: 'rgb(233, 226, 226)',
    minWidth: '100vw',
  },

  // ── Sidebar
  sidebar: {
    width: 220,
    minHeight: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
    paddingLeft: 8,
  },
  logoIcon: { fontSize: 22 },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 14px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  navItemActive: {
    background: "#e0f2fe",
    color: "#0284c7",
    fontWeight: 600,
  },
  navIcon: { fontSize: 16 },
  createBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#38bdf8",
    color: "#ffffff",
    border: "none",
    borderRadius: 24,
    padding: "11px 0",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 16,
    marginBottom: 12,
    transition: "background 0.15s",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxShadow: "0 4px 12px rgba(56,189,248,0.3)",
  },
  logoutBtn: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  // ── Main
  main: {
    flex: 1,
    padding: "28px 36px",
    overflowY: "auto",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "10px 16px",
    marginBottom: 28,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  searchIcon: { fontSize: 16, color: "#94a3b8" },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#1e293b",
    background: "transparent",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
  },
  pageSubtitle: { fontSize: 13, color: "#94a3b8" },
  fileCount: {
    display: "flex",
    alignItems: "baseline",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "6px 14px",
  },
  fileCountNum: { fontSize: 18, fontWeight: 700, color: "#0f172a" },
  fileCountLabel: { fontSize: 12, color: "#94a3b8" },
  tableHeader: {
    display: "flex",
    alignItems: "center",
    padding: "0 16px 10px",
    gap: 8,
  },
  colHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  sortBar: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
  },
  sortBtn: {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  sortBtnActive: {
    background: "#eff6ff",
    borderColor: "#38bdf8",
    color: "#0284c7",
    fontWeight: 600,
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  fileRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.15s",
    animation: "fadeUp 0.25s ease both",
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  fileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fileIcon: { fontSize: 18 },
  fileName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 6,
    letterSpacing: "0.04em",
  },
  modifiedText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: 4,
    transition: "opacity 0.15s",
    width: 96,
    justifyContent: "flex-end",
    
  },
  actionBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: 6,
    width: 28,
    height: 28,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    gap: 10,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: "#1e293b" },
  emptySubtitle: { fontSize: 13, color: "#94a3b8" },
};