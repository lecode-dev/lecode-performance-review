export function SkeletonLine({ w = '100%', h = 14 }: { w?: string | number; h?: number }) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width: w, height: h, borderRadius: 6 }}
    />
  )
}

export function SkeletonCard({ lines = 3, h }: { lines?: number; h?: number }) {
  return (
    <div className="card card-pad" style={h ? { minHeight: h } : {}}>
      <div className="col" style={{ gap: 12 }}>
        <SkeletonLine w="40%" h={16} />
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} w={i === lines - 1 ? '60%' : '90%'} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonPage({ title = true, cards = 3 }: { title?: boolean; cards?: number }) {
  return (
    <div className="content anim-in">
      {title && (
        <div className="page-head">
          <SkeletonLine w={80} h={11} />
          <SkeletonLine w={200} h={24} />
          <SkeletonLine w={320} h={14} />
        </div>
      )}
      <div className="col" style={{ gap: 14 }}>
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} lines={i === 0 ? 4 : 2} />
        ))}
      </div>
    </div>
  )
}
