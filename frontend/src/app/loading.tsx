import { Skeleton } from "@/components/ui/primitives";
export default function Loading() {
  return (
    <div className="loading-page">
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-card" />
      <Skeleton className="skeleton-card" />
    </div>
  );
}
