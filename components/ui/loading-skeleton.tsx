export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 skeleton rounded"></div>
      <div className="h-64 skeleton rounded"></div>
      <div className="h-12 skeleton rounded"></div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="h-40 skeleton rounded-lg"></div>
  )
}

export function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="h-12 skeleton rounded"></div>
      ))}
    </div>
  )
}