export function SectionHeader({ emoji, label }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"14px 16px 6px",
      fontSize:11, fontWeight:800,
      color:"rgba(26,26,24,0.40)",
      letterSpacing:"0.07em",
      textTransform:"uppercase",
    }}>
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}
