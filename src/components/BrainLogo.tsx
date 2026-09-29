export function BrainLogo({ size = 54 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M31 10c-5-7-15-3-14 5-7 0-10 9-5 13-6 5-2 14 5 14-2 8 9 13 14 6V10Z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M33 10c5-7 15-3 14 5 7 0 10 9 5 13 6 5 2 14-5 14 2 8-9 13-14 6V10Z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M23 17c6 1 4 7 1 9m-7-2c7 0 8 7 5 11m8-16c-5 2-5 8-2 11m-8 13c2-6 7-6 10-4M41 17c-6 1-4 7-1 9m7-2c-7 0-8 7-5 11m-8-16c5 2 5 8 2 11m8 13c-2-6-7-6-10-4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
