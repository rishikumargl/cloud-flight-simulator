export default function LoadingSkeleton({ count = 1, type = 'card' }) {
  const cardSkeleton = (
    <div className="bg-white rounded-xl p-6 border border-cloud-100">
      <div className="space-y-4">
        <div className="h-6 bg-cloud-200 rounded skeleton w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-cloud-200 rounded skeleton"></div>
          <div className="h-4 bg-cloud-200 rounded skeleton w-5/6"></div>
        </div>
      </div>
    </div>
  );

  const rowSkeleton = (
    <div className="flex items-center gap-4 p-4 border-b border-cloud-100">
      <div className="h-12 w-12 bg-cloud-200 rounded skeleton"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-cloud-200 rounded skeleton w-1/2"></div>
        <div className="h-3 bg-cloud-200 rounded skeleton w-3/4"></div>
      </div>
    </div>
  );

  const skeletonMap = {
    card: cardSkeleton,
    row: rowSkeleton,
  };

  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i}>{skeletonMap[type]}</div>
        ))}
    </div>
  );
}
