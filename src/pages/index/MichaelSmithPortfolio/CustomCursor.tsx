export function CustomCursor({ cursorRef }: { cursorRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={cursorRef}
      className="fixed w-8 h-8 border border-white/20 rounded-full pointer-events-none z-[999] hidden lg:block mix-blend-difference"
    />
  );
}
