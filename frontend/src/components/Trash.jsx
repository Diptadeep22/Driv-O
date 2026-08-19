import React, { useState, useEffect } from 'react'
import '../App.css'
import Navbar from './Navbar'
import { useNavigate } from 'react-router-dom'

function Trash() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Fetch trashed files ──────────────────────
  useEffect(() => {
    const fetchTrash = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/"); return; }

        const res = await fetch("http://localhost:5000/api/files/trash", {
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

    fetchTrash();
  }, []);

  // ── Restore file ─────────────────────────────
  const restoreFile = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/files/restore/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Restore error:", err);
    }
  };

  // ── Permanent delete ─────────────────────────
  const deleteForever = async (id) => {
    const confirm = window.confirm("Delete this file forever? This cannot be undone.");
    if (!confirm) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/files/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
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
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const getType = (mimeType) => {
    return mimeType?.split("/")[1]?.toUpperCase() || "FILE";
  };

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
                {!loading && !error && files.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                      Trash is empty
                    </td>
                  </tr>
                )}
                {!loading && files.map((file) => (
                  <tr key={file._id}>
                    <td className='p1'>{file.name}</td>
                    <td className='p2'>{getType(file.mimeType)}</td>
                    <td className='p3'>{formatDate(file.trashedAt)}</td>
                    <td className='p3'>{formatSize(file.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Filter Bar ── */}
            <div className='FilterBy'>
              <div className='Type'>
                <p style={{ fontSize: "medium", fontWeight: 500 }}>Type</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
              <div className='Type'>
                <p style={{ fontSize: "medium", fontWeight: 500 }}>People</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
              <div className='Type' style={{ width: "110px" }}>
                <p style={{ fontSize: "medium", fontWeight: 500 }}>Modified</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
              <div className='Type'>
                <p style={{ fontSize: "medium", fontWeight: 500 }}>Source</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
            </div>

            {/* ── Files List or Empty Illustration ── */}
            <div className='files'>
              {loading && (
                <p style={{ color: "#888", padding: "10px" }}>Loading...</p>
              )}

              {/* Show illustration only when trash is empty */}
              {!loading && files.length === 0 && (
                <img
                  src="Trash.png"
                  style={{ width: "500px", height: "400px", filter: "blur(1px)" }}
                />
              )}

              {/* Show files when trash has items */}
              {!loading && files.map((file) => (
                <div key={file._id} className='file1'>
                  <p className='p1'>{file.name}</p>
                  <p className='p2'>{getType(file.mimeType)}</p>
                  <p className='p3'>{formatDate(file.trashedAt)}</p>

                  {/* Restore button */}
                  <button
                    onClick={() => restoreFile(file._id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#22c55e",
                      marginRight: "6px",
                    }}
                    title="Restore"
                  >
                    ♻️
                  </button>

                  {/* Delete forever button */}
                  <button
                    onClick={() => deleteForever(file._id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#ef4444",
                    }}
                    title="Delete forever"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

          </section>
        </main>

        <button className='logout' onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default Trash;