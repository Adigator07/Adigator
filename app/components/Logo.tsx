export default function Logo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 500 500"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 neon-glow-logo"
    >
      <style>{`
        .adigator-primary { fill: currentColor; }
        .adigator-cutout  { fill: #020617; }

        @media (prefers-color-scheme: dark) {
          .adigator-primary { fill: #ffffff; }
          .adigator-cutout  { fill: #020617; }
        }

        @keyframes neon-glow {
          0% {
            filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.8)) drop-shadow(0 0 16px rgba(236, 72, 153, 0.5));
          }
          33% {
            filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.8)) drop-shadow(0 0 16px rgba(139, 92, 246, 0.5));
          }
          66% {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.5));
          }
          100% {
            filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.8)) drop-shadow(0 0 16px rgba(236, 72, 153, 0.5));
          }
        }

        .neon-glow-logo {
          animation: neon-glow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Logo centered at 250,250 */}
      <g transform="translate(250, 250)">
        {/* Outer bold hexagon */}
        <polygon
          points="0,-130 112,-65 112,65 0,130 -112,65 -112,-65"
          className="adigator-primary"
        />

        {/* Inner diamond cutout */}
        <polygon
          points="0,-62 54,0 0,62 -54,0"
          className="adigator-cutout"
        />

        {/* Top-left slash accent cutout */}
        <polygon
          points="-78,-100 -42,-100 -94,-10 -112,-10"
          className="adigator-cutout"
        />

        {/* Bottom-right slash accent cutout */}
        <polygon
          points="78,100 42,100 94,10 112,10"
          className="adigator-cutout"
        />
      </g>
    </svg>
  );
}
