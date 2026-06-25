import { SkeletonLine, SkeletonCard } from '@/components/lecode/Skeleton'

export default function Loading() {
  return (
    <div className="content anim-in">
      <div className="page-head">
        <SkeletonLine w={80} h={11} />
        <SkeletonLine w={180} h={24} />
        <SkeletonLine w={340} h={14} />
      </div>
      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        {[1, 2, 3, 4].map((i) => (
          <div className="card stat" key={i}>
            <SkeletonLine w="60%" h={12} />
            <SkeletonLine w={60} h={30} />
          </div>
        ))}
      </div>
      <SkeletonCard lines={5} />
    </div>
  )
}
