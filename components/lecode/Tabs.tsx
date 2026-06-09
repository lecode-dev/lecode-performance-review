interface TabItem {
  id: string
  label: string
  count?: number | null
}

interface TabsProps {
  tabs: TabItem[]
  value: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={'tab ' + (value === t.id ? 'active' : '')} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count != null && (
            <span style={{ marginLeft: 6, opacity: 0.6, fontFamily: 'var(--mono)' }}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
