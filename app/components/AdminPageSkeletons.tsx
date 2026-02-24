import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { DashboardMetricsGridSkeleton } from "~/components/DashboardMetricSkeleton";

export function AdminHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-72" />
    </div>
  );
}

export function AdminDashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <AdminHeaderSkeleton />
      <DashboardMetricsGridSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-full">
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminUsersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <AdminHeaderSkeleton />
        <Skeleton className="h-10 w-36" />
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-md border p-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-60" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminOrdersPageSkeleton() {
  return (
    <div className="space-y-4">
      <AdminHeaderSkeleton />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-8 gap-3 rounded-md border p-3">
              <Skeleton className="h-4 col-span-1" />
              <Skeleton className="h-4 col-span-2" />
              <Skeleton className="h-4 col-span-1" />
              <Skeleton className="h-4 col-span-1" />
              <Skeleton className="h-4 col-span-1" />
              <Skeleton className="h-4 col-span-1" />
              <Skeleton className="h-4 col-span-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

