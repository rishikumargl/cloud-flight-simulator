export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cloud base */}
      <path
        d="M8 22C5.24 22 3 19.76 3 17C3 14.48 5 12.42 7.5 12.08C7.3 11.1 7.2 10.06 7.2 9C7.2 5.04 10.24 2 14.2 2C17.56 2 20.4 4.08 21 7.04C21.62 6.86 22.3 6.8 23 6.8C27.44 6.8 31 10.36 31 14.8C31 16.12 30.72 17.38 30.2 18.52"
        fill="currentColor"
      />

      {/* Airplane */}
      <g transform="translate(20, 20)">
        {/* Fuselage */}
        <path
          d="M-2 -8 L-2 6 Q0 8 2 6 L2 -8 Z"
          fill="currentColor"
        />

        {/* Wings */}
        <rect x="-10" y="-1" width="20" height="2" fill="currentColor" />

        {/* Tail */}
        <path
          d="M-1 5 L-3 8 L3 8 Z"
          fill="currentColor"
        />
      </g>

      {/* Highlight effect */}
      <circle cx="10" cy="8" r="2.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
