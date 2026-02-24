import { Skeleton } from "~/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <Skeleton className="h-12 w-40 md:h-16 md:w-56" />
              <Skeleton className="h-12 w-56 md:h-16 md:w-72" />
              <Skeleton className="h-6 w-full max-w-lg" />
              <Skeleton className="h-6 w-5/6 max-w-md" />
              <Skeleton className="h-12 w-40 rounded-full" />
            </div>
            <Skeleton className="h-72 w-full rounded-xl md:h-96" />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-4 text-center">
            <Skeleton className="mx-auto h-10 w-64" />
            <Skeleton className="mx-auto h-10 w-56" />
            <Skeleton className="mx-auto h-10 w-72" />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </section>
    </main>
  );
}

