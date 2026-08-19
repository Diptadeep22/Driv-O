import React, { useState, useEffect } from 'react'
import '../App.css'
import Navbar from './Navbar'
import { useNavigate } from 'react-router-dom'

function Shared() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Fetch shared files ───────────────────────
  useEffect(() => {
    const fetchShared = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/"); return; }

        const res = await fetch("http://localhost:5000/api/files/shared", {
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

    fetchShared();
  }, []);

  // ── Format date ──────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
    });
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
                  <th>Shared By</th>
                  <th>Date</th>
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
                      No files shared with you yet
                    </td>
                  </tr>
                )}
                {!loading && files.map((file) => (
                  <tr key={file._id}>
                    <td className='p1'>{file.name}</td>
                    <td className='p2'>{file.sharedByName || "Unknown"}</td>
                    <td className='p3'>{formatDate(file.sharedAt)}</td>
                    <td className='p3'>
                      {file.size
                        ? file.size < 1048576
                          ? (file.size / 1024).toFixed(1) + " KB"
                          : (file.size / 1048576).toFixed(1) + " MB"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Filter Bar ── */}
            <div className='FilterBy'>
              <div className='Type'>
                <p style={{ fontSize: "medium", fontWeight: 500, color: "black" }}>Type</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
              <div className='Type'>
                <p style={{ fontSize: "medium", fontWeight: 500, color: "black" }}>People</p>
                <img src="Dropdown.svg" style={{ height: "20px", width: "20px" }} />
              </div>
              <div className='Type' style={{ width: "110px" }}>
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
                <p style={{ color: "#888", padding: "10px" }}>Loading...</p>
              )}
              {!loading && files.length === 0 && (
                <p style={{ color: "#888", padding: "10px" }}>No files shared with you yet</p>
              )}
              {!loading && files.map((file) => (
                <div key={file._id} className='file1'>
                  <p className='p1'>{file.name}</p>
                  <p className='p2'>{file.sharedByName || "Unknown"}</p>
                  <p className='p3'>{formatDate(file.sharedAt)}</p>
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

export default Shared;