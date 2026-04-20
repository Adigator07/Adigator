import Link from "next/link";
import Logo from "./components/Logo";
export default function Home() {
  return (
    <main style={{ fontFamily: "Arial", background: "#050816", color: "white" }}>
      
      {/* NAVBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 40px", alignItems: "center" }}>
        <Logo size="md" animated={true} />
        <div>
          <span style={{ marginRight: "20px" }}>Solutions</span>
          <span style={{ marginRight: "20px" }}>About</span>
          <span style={{ marginRight: "20px" }}>Contact</span>
          <Link href="/login">
          <button style={{ padding: "8px 16px", border: "1px solid #8b5cf6", background: "transparent", color: "#8b5cf6" }}>
         Login
          </button>
          </Link>
        </div>
      </div>

      {/* HERO */}
      <div style={{ display: "flex", padding: "80px 40px", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "50px", lineHeight: "1.2" }}>
            Creative Intelligence for Modern Advertising
          </h1>

          <p style={{ marginTop: "20px", color: "#9ca3af", fontSize: "18px" }}>
            Understand how your ads perform before they go live. Analyze creatives, improve engagement, and maximize results using AI.
          </p>

          <div style={{ marginTop: "30px" }}>
            <Link href="/intelligence">
              <button style={{ padding: "12px 24px", background: "#8b5cf6", color: "white", marginRight: "10px" }}>
                Start Analysis
              </button>
            </Link>

            <Link href="/preview">
              <button style={{ padding: "12px 24px", border: "1px solid white", background: "transparent", color: "white" }}>
                Preview Creatives
              </button>
            </Link>
          </div>
        </div>

        {/* IMAGE */}
        <div style={{ flex: 1 }}>
          <img 
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995"
            alt="AI Marketing"
            style={{ width: "100%", borderRadius: "10px" }}
          />
        </div>

      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: "60px 40px", textAlign: "center" }}>
        <h2>How It Works</h2>

        <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginTop: "40px", flexWrap: "wrap" }}>
          
          <div style={{ maxWidth: "250px" }}>
            <h3>1. Upload Creatives</h3>
            <p style={{ color: "#9ca3af" }}>Upload banners, videos or ad creatives easily.</p>
          </div>

          <div style={{ maxWidth: "250px" }}>
            <h3>2. AI Analysis</h3>
            <p style={{ color: "#9ca3af" }}>We analyze color, text, CTA and structure.</p>
          </div>

          <div style={{ maxWidth: "250px" }}>
            <h3>3. Get Insights</h3>
            <p style={{ color: "#9ca3af" }}>Receive actionable insights and improvements.</p>
          </div>

        </div>
      </div>

      {/* SOLUTIONS */}
      <div style={{ padding: "60px 40px" }}>
        <h2 style={{ marginBottom: "30px" }}>Our Solutions</h2>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          
          <div style={{ background: "#111827", padding: "20px", borderRadius: "10px", width: "300px" }}>
            <h3>Preview Tool</h3>
            <p style={{ color: "#9ca3af" }}>
              Generate structured decks automatically from creatives.
            </p>
          </div>

          <div style={{ background: "#111827", padding: "20px", borderRadius: "10px", width: "300px" }}>
            <h3>Intelligence Check</h3>
            <p style={{ color: "#9ca3af" }}>
              AI-powered analysis for creative performance optimization.
            </p>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "20px 40px", borderTop: "1px solid #1f2937" }}>
        <p style={{ color: "#9ca3af" }}>© 2026 Adigator</p>
      </div>

    </main>
  );
}