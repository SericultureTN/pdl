function HeroIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -right-10 bottom-1/4 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="waves" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M0 60 Q30 40 60 60 T120 60"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
              <path
                d="M0 80 Q30 60 60 80 T120 80"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#waves)" />
        </svg>
      </div>

      <svg
        viewBox="0 0 480 420"
        className="relative z-10 w-[65%] max-w-lg drop-shadow-2xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Mulberry leaves with silk cocoon"
      >
        <ellipse cx="240" cy="380" rx="160" ry="20" fill="black" opacity="0.15" />
        <path
          d="M120 320C80 280 60 220 70 160C80 100 130 60 200 50C240 45 280 55 310 80"
          stroke="#2D6A4F"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M360 310C400 270 420 210 410 150C400 90 350 50 280 40"
          stroke="#2D6A4F"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />
        <g opacity="0.95">
          <path
            d="M180 280C140 240 120 180 140 120C155 75 200 45 240 55C280 65 310 110 300 160C290 210 250 260 180 280Z"
            fill="#40916C"
          />
          <path
            d="M180 280C200 220 220 160 240 100C260 160 280 220 300 280C270 270 220 275 180 280Z"
            fill="#2D6A4F"
          />
          <path d="M240 55L240 280" stroke="#1B4332" strokeWidth="2" opacity="0.4" />
        </g>
        <g opacity="0.95">
          <path
            d="M300 290C340 250 360 190 350 130C340 80 300 50 260 60C220 70 200 120 210 170C220 220 250 270 300 290Z"
            fill="#52B788"
          />
          <path
            d="M260 290C280 230 300 170 320 110C340 170 360 230 380 290C350 280 300 285 260 290Z"
            fill="#40916C"
          />
        </g>
        <g opacity="0.9">
          <path
            d="M100 250C60 210 50 160 70 110C90 60 140 40 170 70C200 100 190 160 160 200C140 230 120 245 100 250Z"
            fill="#74C69D"
          />
        </g>
        <ellipse
          cx="240"
          cy="200"
          rx="55"
          ry="75"
          fill="url(#cocoonGrad)"
          stroke="#D4AF37"
          strokeWidth="2"
          opacity="0.95"
        />
        <ellipse cx="240" cy="200" rx="35" ry="50" fill="white" opacity="0.12" />
        <path
          d="M240 125C220 155 215 185 215 215C215 245 225 270 240 275"
          stroke="#F5E6A3"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <path
          d="M240 125C260 155 265 185 265 215C265 245 255 270 240 275"
          stroke="#F5E6A3"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <defs>
          <linearGradient id="cocoonGrad" x1="185" y1="125" x2="295" y2="275">
            <stop stopColor="#F5F0E8" />
            <stop offset="0.5" stopColor="#E8DCC8" />
            <stop offset="1" stopColor="#D4C4A8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default HeroIllustration;
