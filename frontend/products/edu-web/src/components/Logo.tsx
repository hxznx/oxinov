/** Approved Oxinov symbol from @oxinov/design-system (copied to /brand); never redrawn here. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex" style={{ width: size, height: size }}>
      <img className="logo-dark" src="/brand/oxinov-symbol.svg" alt="" width={size} height={size} />
      <img className="logo-light" src="/brand/oxinov-symbol-light.svg" alt="" width={size} height={size} />
    </span>
  );
}
