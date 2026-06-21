export function FigurineCard({ img, role, getStyle }: { img: { src: string; bg: string; panel: string }; role: string; getStyle: (role: string) => React.CSSProperties | undefined }) {
  const style = getStyle(role);
  return (
    <div style={{
      position: 'absolute', aspectRatio: '0.6 / 1', ...style,
      transition: 'transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1)',
      willChange: 'transform, filter, opacity'
    }}>
      <img src={img.src} alt="" className="w-full h-full object-contain object-bottom pointer-events-none" draggable={false} />
    </div>
  );
}
