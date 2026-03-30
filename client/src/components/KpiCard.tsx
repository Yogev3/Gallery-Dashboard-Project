interface KpiCardProps {
  label: string
  value: string | number
  variant: 'failed' | 'pending' | 'ok' | 'neutral'
}

export default function KpiCard({ label, value, variant }: KpiCardProps) {
  return (
    <div className={`kpi-card kpi-${variant}`}>
      <div className="val">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="lbl">{label}</div>
    </div>
  )
}
