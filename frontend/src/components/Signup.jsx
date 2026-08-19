import React, { useRef, useState } from 'react'
import '../App.css'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useNavigate } from 'react-router-dom'

function Signup() {
  const [opacity1, setOpacity1] = useState(0);
  const [opacity2, setOpacity2] = useState(0);

  // ── Form state ──────────────────────────────
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "" });
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tl = useRef();
  const navigate = useNavigate();

  // ── GSAP — untouched ────────────────────────
  useGSAP(() => {
    gsap.set(".pic4", { opacity: 0 })
    tl.current = gsap.timeline({
      ease: "power3.inOut",
      paused: true,
    });
    tl.current.to(".signup", { x: "50vw", duration: 1 })
    tl.current.to(".signup", { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", duration: 0.8 }, "-=0.6")
    tl.current.to(".signup-content", { opacity: 0, duration: 0.5 })
    tl.current.to(".pic4", { opacity: 1, duration: 0.3 })
    tl.current.to(".note1", { opacity: 1, duration: 0.3 })
  }, [])

  const runAnimation = () => { tl.current.play() }
  const runAnimationBack = () => { tl.current.reverse() }

  // ── Signup handler ───────────────────────────
  const handleSignup = async () => {
    setError("");

    // Basic validation
    if (!signupData.name || !signupData.email || !signupData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/home");

    } catch (err) {
      setError("Something went wrong. Is your server running?");
    } finally {
      setLoading(false);
    }
  };

  // ── Login handler ────────────────────────────
  const handleLogin = async () => {
    setError("");

    if (!loginData.email || !loginData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/home");

    } catch (err) {
      setError("Something went wrong. Is your server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container'>
      <div className="signup">
        <div className="signup-content">
          <h1 style={{ position: "absolute", top: "20%", left: "37%", color: "wheat" }}>SignUp</h1>

          {/* Error */}
          {error && (
            <p style={{ position: "absolute", top: "13%", left: "30%", color: "red", fontSize: "13px", zIndex: 10 }}>
              {error}
            </p>
          )}

          <form className='users' onSubmit={(e) => e.preventDefault()}>
            <input
              className='f1' type='text' placeholder='Name'
              value={signupData.name}
              onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
            />
            <input
              className='f2' type='email' placeholder='email'
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            />
            <input
              className='f3' type='password' placeholder='password'
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
            />
          </form>

          <button className='account' onClick={handleSignup} disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          {/* Untouched */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", height: "30px", width: "500px", gap: "5px" }}>
            <p>Already a user?</p>
            <p style={{ color: "red", cursor: "pointer" }} onClick={runAnimation}>Move to Login</p>
          </div>
        </div>
      </div>

      <div className="login">
        <div className="customer-content">
          <h1 style={{ position: "absolute", top: "20%", left: "40%", zIndex: 1 }}>Login</h1>

          {/* Error */}
          {error && (
            <p style={{ position: "absolute", top: "13%", left: "30%", color: "red", fontSize: "13px", zIndex: 10 }}>
              {error}
            </p>
          )}

          <form className='customer' onSubmit={(e) => e.preventDefault()}>
            <input
              className='f4' type='email' placeholder='email'
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <input
              className='f5' type='password' placeholder='password'
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
          </form>

          <button className='account' onClick={handleLogin} disabled={loading} style={{ zIndex: 1 }}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Untouched */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", height: "30px", width: "500px", gap: "5px" }}>
            <p style={{ color: "black" }}>New to this?</p>
            <p style={{ color: "red", cursor: "pointer" }} onClick={runAnimationBack}>Move to Signup</p>
          </div>
        </div>
      </div>

      {/* All images and notes — completely untouched */}
      <img src="login1.svg" className='pic3' />
      <img src='pic1.svg' className='pic1' />
      <img src='pic2.svg' className='pic2' />
      <img src="info2.svg" className="pic5" onMouseEnter={() => setOpacity1(1)} onMouseLeave={() => setOpacity1(0)} />
      <img src="info2.svg" className="pic6" onMouseEnter={() => setOpacity2(1)} onMouseLeave={() => setOpacity2(0)} />
      <img src="info1.svg" className='pic4' style={{ position: "absolute", top: "15%", left: "60%", width: "40px", height: "80px", zIndex: 6, opacity: 0 }} />
      <div className="note1" style={{ position: "absolute", top: "25%", left: "60%", width: "250px", height: "300px", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, zIndex: 6 }}>
        <p style={{ color: "white", zIndex: 6 }}>This website works like Google Drive, allowing users to store, organize, and share files securely online. In addition to cloud storage, it uses AI tools to enhance user productivity by offering smart search, automatic file organization, content suggestions, and helpful insights. These AI features make managing files faster, easier, and more efficient for users</p>
      </div>
      <div className="note2" style={{ height: "100px", width: "250px", backgroundColor: "rgb(233, 226, 226)", position: "absolute", top: "52%", left: "80%", opacity: opacity1, transition: "opacity 0.6s ease" }}>
        <p style={{ color: "black" }}>Turn your ideas into insights. Track, analyze, and grow smarter every day</p>
      </div>
      <div className="note3" style={{ height: "100px", width: "250px", backgroundColor: "rgb(233, 226, 226)", position: "absolute", top: "80%", left: "60%", opacity: opacity2, transition: "opacity 0.6s ease" }}>
        <p style={{ color: "black" }}>All your data, one simple place. Stay connected. Stay in control</p>
      </div>
    </div>
  )
}

export default Signup