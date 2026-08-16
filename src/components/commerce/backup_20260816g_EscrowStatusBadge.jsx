// EscrowStatusBadge — zeigt Escrow-Status visuell
export default function EscrowStatusBadge({ escrowStatus = 'none', deliveryStatus = 'pending', size = 'sm' }) {
  const configs = {
    none:     { label: 'Keine Escrow',         color: '#8B8FA8', bg: 'rgba(139,143,168,0.1)' },
    holding:  { label: 'Bezahlt – blockiert',  color: '#FF8A6B', bg: 'rgba(255,138,107,0.12)' },
    released: { label: 'Freigegeben',          color: '#16D7C5', bg: 'rgba(22,215,197,0.12)' },
    disputed: { label: 'In Prüfung',           color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    refunded: { label: 'Erstattet',            color: '#E83A3A', bg: 'rgba(232,58,58,0.12)' },
  }
  const deliveryConfigs = {
    pending:   { label: 'Warte auf Lieferung' },
    shipped:   { label: 'Versendet' },
    executed:  { label: 'Ausgeführt' },
    delivered: { label: 'Geliefert' },
    confirmed: { label: 'Bestätigt' },
    disputed:  { label: 'Auszahlungsantrag gestellt' },
  }
  const c = configs[escrowStatus] || configs.none
  const d = deliveryConfigs[deliveryStatus] || deliveryConfigs.pending
  const fontSize = size === 'sm' ? 11 : 13
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <span style={{
        display:'inline-flex', alignItems:'center', gap:5,
        padding:'3px 10px', borderRadius:20,
        background: c.bg, color: c.color,
        fontSize, fontWeight:600,
      }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:c.color, flexShrink:0 }}/>
        {c.label}
      </span>
      {escrowStatus === 'holding' && (
        <span style={{ fontSize: fontSize-1, color:'rgba(26,26,46,0.45)', paddingLeft:4 }}>
          {d.label}
        </span>
      )}
    </div>
  )
}
