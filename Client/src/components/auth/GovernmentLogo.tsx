function GovernmentLogo() {
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <svg
        viewBox="0 0 80 80"
        className="h-20 w-20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="40" cy="40" r="38" stroke="#0B5D3B" strokeWidth="2" />
        <circle cx="40" cy="40" r="32" fill="#0B5D3B" opacity="0.08" />
        <path
          d="M40 12L48 28H32L40 12Z"
          fill="#D4AF37"
        />
        <path
          d="M40 68C28 56 22 44 22 34C22 24 30 18 40 18C50 18 58 24 58 34C58 44 52 56 40 68Z"
          fill="#0B5D3B"
        />
        <path
          d="M40 58C34 50 30 42 30 36C30 30 34 26 40 26C46 26 50 30 50 36C50 42 46 50 40 58Z"
          fill="#0F7A4A"
        />
        <text
          x="40"
          y="44"
          textAnchor="middle"
          fill="#0B5D3B"
          fontSize="8"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          TN
        </text>
      </svg>
    </div>
  );
}

export default GovernmentLogo;
