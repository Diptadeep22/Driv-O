import React, { useState, useEffect } from 'react'
import '../App.css'
import Navbar from './Navbar'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Fetch files on page load ─────────────────
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem("token");

        // If no token, redirect to login
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

        // Separate folders and files
        setFolders(data.files.filter((f) => f.type === "folder"));
        setFiles(data.files.filter((f) => f.type === "file"));

      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // ── Logout ───────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ── Format file size ─────────────────────────
  const formatSize = (bytes) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // ── Format date ──────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  // ✅ This returns clean short labels
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
                      No files yet. Click + Create to upload!
                    </td>
                  </tr>
                )}
                {!loading && files.map((file) => (
                  <tr key={file._id}>
                    <td className='p1'>{file.name}</td>
                    <td className='p2'>{getType}</td>
                    <td className='p3'>{formatDate(file.updatedAt)}</td>
                    <td className='p3'>{formatSize(file.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Suggested Folders ── */}
            <h3 style={{ paddingLeft: "10px" }}>Suggested Folder</h3>
            <img src="Dropdown.svg" style={{ height: "20px", width: "20px", position: "absolute", top: "18%", left: "31.5%" }} />
            <div className='Recent'>
              {folders.length === 0 ? (
                <div className='Type' style={{ width: "200px" }}>
                  <p style={{ fontSize: "medium", fontWeight: 500, color: "#888" }}>No folders yet</p>
                </div>
              ) : (
                folders.map((folder) => (
                  <div key={folder._id} className='Type' style={{ width: "200px" }}>
                    <p style={{ fontSize: "medium", fontWeight: 500, color: "black" }}>{folder.name}</p>
                    <img src="Folder.svg" style={{ height: "20px", width: "20px" }} />
                  </div>
                ))
              )}
            </div>

            {/* ── Files List ── */}
            <div className='files'>
              {!loading && files.map((file) => (
                <div key={file._id} className='file1'>
                  <p className='p1'>{file.name}</p>
                  <p className='p2'>{file.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}</p>
                  <p className='p3'>{formatDate(file.updatedAt)}</p>
                </div>
              ))}
              {!loading && files.length === 0 && (
                <p style={{ color: "#888", padding: "10px" }}>No files uploaded yet</p>
              )}
            </div>

            <button className='logout' onClick={logout}>Logout</button>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Home;