import { SkeletonLine, SkeletonCard } from '@/components/lecode/Skeleton'

export default function Loading() {
  return (
    <div className="content anim-in">
      <div className="page-head">
        <SkeletonLine w={80} h={11} />
        <SkeletonLine w={200} h={24} />
        <SkeletonLine w={300} h={14} />
      </div>
      <SkeletonCard lines={3} />
      <div style={{ marginTop: 14 }}>
        <SkeletonCard lines={2} />
      </div>
    </div>
  )
}
