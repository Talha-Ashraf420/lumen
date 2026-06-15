/** Ambient, GPU-cheap animated background. Fixed behind all content. */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      <div
        className="aurora-blob absolute -left-[10%] top-[-15%] h-[55vh] w-[55vh] rounded-full bg-amber-glow/10 blur-[120px]"
        style={{ animation: "drift-a 26s ease-in-out infinite" }}
      />
      <div
        className="aurora-blob absolute right-[-10%] top-[10%] h-[50vh] w-[50vh] rounded-full bg-indigo-500/10 blur-[130px]"
        style={{ animation: "drift-b 32s ease-in-out infinite" }}
      />
      <div
        className="aurora-blob absolute bottom-[-20%] left-[30%] h-[45vh] w-[45vh] rounded-full bg-fuchsia-500/8 blur-[140px]"
        style={{ animation: "drift-c 38s ease-in-out infinite" }}
      />
      {/* subtle grain/grid for texture */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  );
}
