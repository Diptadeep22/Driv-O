import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import '../App.css'
import { useNavigate } from 'react-router-dom'

function My_Drive() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");

  // ── Fetch files on load ──────────────────────
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/");
          return;
        }

        const res = await fetch("http://localhost:5000/api/files", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch files");
          return;
        }

        setFiles(data.files);

      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
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

      if (res.ok) {
        // Remove from UI instantly
        setFiles((prev) => prev.filter((f) => f._id !== id));
      }
    } catch (err) {
      console.error("Trash error:", err);
    }
  };

  // ── Format helpers ───────────────────────────
  const formatSize = (bytes) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getType = (mimeType) => {
    if (!mimeType) return "FILE";
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("word") || mimeType.includes("document")) return "DOCX";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLSX";
    if (mimeType.includes("presentation")) return "PPTX";
    if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase();
    if (mimeType.startsWith("video/")) return mimeType.split("/")[1].toUpperCase();
    if (mimeType.includes("zip")) return "ZIP";
    return mimeType.split("/")[1]?.toUpperCase() || "FILE";
  };


  // ── Filter logic ─────────────────────────────
  const filteredFiles = files.filter((f) => {
    if (filterType === "all") return true;
    return f.mimeType?.includes(filterType);
  });

  // ── Logout ───────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div>
      <div className="container">
        <Navbar />
        <main className="main">

          <header className="topbar">
            <input
              type="text"
              id="search"
              className="search-box"
              placeholder="Search in Drive"
            />
            <div className="top-icons">⚙ 🔔 👤</div>
            <img src="search.svg" className="search" />
          </header>

          <section className="file-area">

            {/* ── File Table ── */}
            <table className="file-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Modified</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody id="fileList">
                {loading && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                      Loading...
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "red", padding: "20px" }}>
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                      No files found
                    </td>
                  </tr>
                )}
                {!loading && filteredFiles.map((file) => (
                  <tr key={file._id}>
                    <td className='p1'>{file.name}</td>
                    <td className='p2'>{getType(file.mimeType)}</td>
                    <td className='p3'>{formatDate(file.updatedAt)}</td>
                    <td className='p3'>{formatSize(file.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Filter Bar ── */}
            <div className='FilterBy'>
              <div
                className='Type'
                style={{ cursor: "pointer", background: filterType === "pdf" ? "#e0f2fe" : "" }}
                onClick={() => setFilterType(filterType === "pdf" ? "all" : "pdf")}
              >
                <p style={{ fontSize: "medium", fontWeight: 500, color: "black" }}>Type</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
              <div className='Type'>
                <p style={{ fontSize: "medium", fontWeight: 500, color: "black" }}>People</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
              <div
                className='Type'
                style={{
                  width: "110px",
                  cursor: "pointer",
                  background: filterType === "all" ? "#e0f2fe" : "",
                }}
                onClick={() => setFilterType("all")}
              >
                <p style={{ fontSize: "medium", fontWeight: 500, color: "black" }}>Modified</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
              <div className='Type'>
                <p style={{ fontSize: "medium", fontWeight: 500, color: "black" }}>Source</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
            </div>

            {/* ── Files List ── */}
            <div className='files'>
              {loading && (
                <p style={{ color: "#888", padding: "10px" }}>Loading files...</p>
              )}
              {!loading && filteredFiles.map((file) => (
                <div key={file._id} className='file1'>
                  <p className='p1'>{file.name}</p>
                  <p className='p2'>{getType(file.mimeType)}</p>
                  <p className='p3'>{formatDate(file.updatedAt)}</p>
                  {/* Delete button */}
                  <button
                    onClick={() => moveToTrash(file._id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#ef4444",
                    }}
                    title="Move to trash"
                  >
                    🗑
                  </button>
                </div>
              ))}
              {!loading && filteredFiles.length === 0 && (
                <p style={{ color: "#888", padding: "10px" }}>No files uploaded yet</p>
              )}
            </div>

          </section>
        </main>

        <button className='logout' onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default My_Drive;