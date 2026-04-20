import Link from "next/link";
export default function Home() {
  return (
    <main style={{ fontFamily: "Arial", background: "#050816", color: "white" }}>
      
      {/* NAVBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 40px", alignItems: "center" }}>
        {/* LOGO */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <svg width="220" height="44" viewBox="0 0 220 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Icon gradients */}
              <linearGradient id="topGrad" x1="0" y1="0" x2="40" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4ade80"/>
                <stop offset="100%" stopColor="#06b6d4"/>
              </linearGradient>
              <linearGradient id="jawGrad" x1="0" y1="20" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f97316"/>
                <stop offset="100%" stopColor="#ef4444"/>
              </linearGradient>
              <linearGradient id="snoutGrad" x1="26" y1="0" x2="44" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fb923c"/>
                <stop offset="100%" stopColor="#fbbf24"/>
              </linearGradient>
              {/* Text gradient */}
              <linearGradient id="textGrad" x1="52" y1="0" x2="218" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22d3ee"/>
                <stop offset="55%" stopColor="#818cf8"/>
                <stop offset="100%" stopColor="#4ade80"/>
              </linearGradient>
              {/* Glow filter */}
              <filter id="iconGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="1.8" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="textGlow" x="-5%" y="-30%" width="110%" height="160%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* === ALLIGATOR ICON === */}
            <g filter="url(#iconGlow)">
              {/* Back/neck ridge */}
              <polygon points="0,22 4,10 10,8 8,22" fill="url(#topGrad)" opacity="0.7"/>
              {/* Upper head */}
              <polygon points="4,10 18,4 28,10 26,20 8,22" fill="url(#topGrad)"/>
              {/* Head highlight facet */}
              <polygon points="10,6 18,4 24,8 16,10" fill="#86efac" opacity="0.5"/>
              {/* Lower jaw */}
              <polygon points="4,22 8,22 26,20 40,22 36,30 4,30" fill="url(#jawGrad)"/>
              {/* Snout upper */}
              <polygon points="26,20 40,18 44,22 40,22" fill="url(#snoutGrad)"/>
              {/* Snout lower */}
              <polygon points="36,30 40,22 44,22 42,28" fill="#f97316" opacity="0.8"/>
              {/* Teeth top */}
              <polygon points="28,20 31,20 29.5,23" fill="white" opacity="0.95"/>
              <polygon points="32,19 35,20 33,23" fill="white" opacity="0.95"/>
              {/* Teeth bottom */}
              <polygon points="28,30 31,30 29.5,27" fill="white" opacity="0.8"/>
              <polygon points="32,30 35,29 33,27" fill="white" opacity="0.8"/>
              {/* Nostril */}
              <ellipse cx="39" cy="19.5" rx="1.2" ry="1" fill="#0f172a" opacity="0.7"/>
              {/* Eye socket */}
              <ellipse cx="14" cy="12" rx="4" ry="3.5" fill="#0f172a" opacity="0.6"/>
              {/* Eye iris */}
              <ellipse cx="14" cy="12" rx="2.5" ry="2.5" fill="#fbbf24"/>
              {/* Pupil */}
              <ellipse cx="14" cy="12" rx="1" ry="1.5" fill="#0f172a"/>
              {/* Eye shine */}
              <ellipse cx="15" cy="11" rx="0.7" ry="0.5" fill="white" opacity="0.9"/>
              {/* Scale lines */}
              <path d="M8,16 Q13,13 18,16" stroke="#166534" strokeWidth="0.7" fill="none" opacity="0.6"/>
              <path d="M12,20 Q17,17 22,20" stroke="#166534" strokeWidth="0.7" fill="none" opacity="0.6"/>
            </g>

            {/* === TEXT === */}
            <text
              x="52" y="29"
              fontFamily="'Arial Black', 'Arial', sans-serif"
              fontWeight="900"
              fontSize="23"
              fill="url(#textGrad)"
              filter="url(#textGlow)"
              letterSpacing="3"
            >ADIGATOR</text>
            {/* Dot-IN tag */}
            <text
              x="55" y="40"
              fontFamily="Arial, sans-serif"
              fontWeight="400"
              fontSize="8"
              fill="#475569"
              letterSpacing="6"
            >INTELLIGENCE</text>
          </svg>
        </Link>
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