import { motion } from "framer-motion";

const rays = Array.from({ length: 18 }, (_, i) => ({
  angle: (i * 360) / 18,
  len: 38 + (i % 3) * 6,
}));

export function GlowingBrainIcon() {
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <motion.div
        className="rays-slow absolute inset-0 flex items-center justify-center opacity-[0.35]"
        aria-hidden
      >
        <svg width="200" height="200" viewBox="0 0 200 200" className="text-amber-400/80">
          <g transform="translate(100,100)">
            {rays.map((r, i) => {
              const rad = (r.angle * Math.PI) / 180;
              const x2 = Math.cos(rad) * r.len;
              const y2 = Math.sin(rad) * r.len;
              return (
                <line
                  key={i}
                  x1={Math.cos(rad) * 28}
                  y1={Math.sin(rad) * 28}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth={i % 2 === 0 ? 2.2 : 1.4}
                  strokeLinecap="round"
                  opacity={0.4 + (i % 4) * 0.12}
                />
              );
            })}
          </g>
        </svg>
      </motion.div>

      <motion.div
        className="brain-glow relative z-10"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          className="drop-shadow-sm"
          aria-hidden
        >
          <defs>
            <radialGradient id="brainGrad" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#fff7d6" />
              <stop offset="45%" stopColor="#fce7a8" />
              <stop offset="100%" stopColor="#e9c46a" />
            </radialGradient>
          </defs>
          <path
            d="M60 18c-8 2-15 8-18 16-10 2-18 12-18 23 0 6 2 12 6 16-2 4-3 9-3 14 0 16 12 28 28 29 4 5 11 8 18 8 7 0 13-3 17-8 16-1 29-14 29-30 0-5-1-10-4-14 4-4 6-10 6-16 0-12-9-22-20-24-4-9-13-15-23-16-4-6-12-10-20-10z"
            fill="url(#brainGrad)"
            stroke="#8b6914"
            strokeWidth="1.8"
            strokeLinejoin="round"
            style={{ strokeLinecap: "round" }}
          />
          <path
            d="M44 52c4-6 10-9 16-9M72 48c5 3 9 9 10 16M48 78c6 4 13 6 21 6"
            fill="none"
            stroke="#7a5c4e"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx="52" cy="46" r="2.2" fill="#5c4033" opacity="0.35" />
          <circle cx="74" cy="50" r="2" fill="#5c4033" opacity="0.3" />
        </svg>
      </motion.div>
    </div>
  );
}
