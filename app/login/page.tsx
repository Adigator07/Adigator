"use client";

import { useState } from "react";
import { supabase } from "../../src/lib/supabaseClient";

type Mode = "login" | "signup";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (mode === "login") {
        // --- REAL LOGIN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        showToast("✓ Login successful", "success");
        setTimeout(() => (window.location.href = "/dashboard"), 1000);
        
      } else {
        // --- REAL SIGNUP LOGIC ---
        if (!name || !email || !password || !confirm) {
          showToast("⚠ Fill in all fields", "error");
          setLoading(false);
          return;
        }
        if (password !== confirm) {
          showToast("⚠ Passwords do not match", "error");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }, // Stores name in Supabase metadata
          },
        });

        if (error) throw error;

        showToast("✓ Success! Check your email to verify.", "success");
      }
    } catch (err: any) {
      showToast(`⚠ ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setEmail("");
    setPassword("");
    setName("");
    setConfirm("");
    setToast(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Orbitron:wght@700&display=swap');

        .neo-wrap {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 40px 20px;
          font-family: 'Space Grotesk', sans-serif;
        }
        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,255,180,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,180,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .glow-orb {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,255,160,0.08) 0%, transparent 70%);
          top: -60px; right: -60px;
          pointer-events: none;
        }
        .glow-orb2 {
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(120,80,255,0.10) 0%, transparent 70%);
          bottom: -40px; left: -40px;
          pointer-events: none;
        }
        .login-card {
          position: relative;
          width: 100%;
          max-width: 400px;
          background: #111111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 36px 36px 32px;
          box-shadow: 0 0 0 1px rgba(0,255,160,0.08), 0 24px 60px rgba(0,0,0,0.6);
          transition: min-height 0.3s;
        }
        .login-card::before {
          content: '';
          position: absolute;
          top: 0; left: 20px; right: 20px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00ffa0, #7B50FF, transparent);
          border-radius: 99px;
        }
        .brand {
          font-family: 'Orbitron', monospace;
          font-size: 11px;
          letter-spacing: 4px;
          color: #00ffa0;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        /* Tab switcher */
        .tab-bar {
          display: flex;
          background: #0d0d0d;
          border: 1px solid #1e1e1e;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
        }
        .tab-btn {
          flex: 1;
          padding: 9px;
          border: none;
          background: transparent;
          border-radius: 7px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #444;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          letter-spacing: 0.5px;
        }
        .tab-btn.active {
          background: #1a1a1a;
          color: #00ffa0;
          box-shadow: 0 0 12px rgba(0,255,160,0.1);
        }
        .tab-btn:not(.active):hover { color: #888; }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2px;
          color: #444;
          text-transform: uppercase;
          display: block;
          margin-bottom: 8px;
        }
        .neo-input {
          width: 100%;
          box-sizing: border-box;
          background: #0d0d0d;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          color: #e0e0e0;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 16px;
        }
        .neo-input::placeholder { color: #333; }
        .neo-input:focus {
          border-color: #00ffa0;
          box-shadow: 0 0 0 3px rgba(0,255,160,0.08);
          color: #fff;
        }
        .neo-input:hover { border-color: #2e2e2e; }
        .neo-input.error-input { border-color: rgba(224,80,80,0.5); }

        .neo-btn {
          width: 100%;
          padding: 13px;
          background: #00ffa0;
          color: #050505;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          box-shadow: 0 0 20px rgba(0,255,160,0.25);
          margin-top: 4px;
        }
        .neo-btn:hover {
          background: #00ffb3;
          box-shadow: 0 0 30px rgba(0,255,160,0.4);
        }
        .neo-btn:active { transform: scale(0.98); background: #00d982; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .divider-line { flex: 1; height: 1px; background: #1a1a1a; }
        .divider-text { font-size: 11px; color: #333; letter-spacing: 1px; }

        .social-row {
          display: flex;
          gap: 10px;
        }
        .social-btn {
          flex: 1;
          padding: 10px;
          background: #0d0d0d;
          border: 1px solid #222;
          border-radius: 8px;
          color: #555;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          letter-spacing: 0.5px;
        }
        .social-btn:hover { border-color: #333; color: #aaa; }

        .terms {
          font-size: 11px;
          color: #333;
          text-align: center;
          margin-top: 16px;
          line-height: 1.6;
        }
        .terms span { color: #7B50FF; cursor: pointer; }
        .terms span:hover { color: #9b7aff; }

        .forgot {
          text-align: right;
          margin-top: -8px;
          margin-bottom: 16px;
        }
        .forgot a {
          font-size: 12px;
          color: #444;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot a:hover { color: #7B50FF; }

        .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          border: 1px solid #222;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          white-space: nowrap;
          z-index: 999;
          font-family: 'Space Grotesk', sans-serif;
        }
        .toast-success { color: #00ffa0; border-color: rgba(0,255,160,0.3); }
        .toast-error   { color: #e05050; border-color: rgba(224,80,80,0.3); }

        .password-hint {
          font-size: 11px;
          color: #333;
          margin-top: -10px;
          margin-bottom: 16px;
        }
      `}</style>

      <main className="neo-wrap">
        <div className="grid-bg" />
        <div className="glow-orb" />
        <div className="glow-orb2" />

        <div className="login-card">
          <div className="brand">System Access</div>

          {/* Tab switcher */}
          <div className="tab-bar">
            <button
              className={`tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Sign In
            </button>
            <button
              className={`tab-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => switchMode("signup")}
            >
              Create Account
            </button>
          </div>

          {/* Sign In Fields */}
          {mode === "login" && (
            <>
              <label className="field-label">Email address</label>
              <input
                className="neo-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="field-label">Password</label>
              <input
                className="neo-input"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="forgot"><a>Forgot password?</a></div>
              <button className="neo-btn" onClick={handleSubmit}>SIGN IN →</button>
            </>
          )}

          {/* Create Account Fields */}
          {mode === "signup" && (
            <>
              <label className="field-label">Full name</label>
              <input
                className="neo-input"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label className="field-label">Email address</label>
              <input
                className="neo-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="field-label">Password</label>
              <input
                className="neo-input"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="password-hint">Min. 8 characters recommended</p>
              <label className="field-label">Confirm password</label>
              <input
                className={`neo-input ${confirm && confirm !== password ? "error-input" : ""}`}
                type="password"
                placeholder="••••••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button className="neo-btn" onClick={handleSubmit}>CREATE ACCOUNT →</button>
              <p className="terms">
                By creating an account you agree to our{" "}
                <span>Terms of Service</span> and <span>Privacy Policy</span>
              </p>
            </>
          )}

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">OR CONTINUE WITH</span>
            <div className="divider-line" />
          </div>

          <div className="social-row">
            <button className="social-btn">G  Google</button>
            <button className="social-btn">⌘  Apple</button>
            <button className="social-btn">in  LinkedIn</button>
          </div>
        </div>

        {toast && (
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        )}
      </main>
    </>
  );
}