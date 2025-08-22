export default function Loading() {
  return (
    <div className="p-8 space-y-4">
      <div className="h-6 w-1/3 bg-gray-300 animate-pulse rounded"></div>
      <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded"></div>
      <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
    </div>
  );
}
