import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function WebsiteCardSkeleton() {
  return (
    <Card className="relative overflow-hidden rounded-xl border border-border/60 shadow-xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md">
      {/* Animated loading gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/10 to-transparent animate-shimmer" />
      
      <CardHeader className="p-6 pb-3">
        <div className="flex justify-between items-start space-x-4">
          <div className="flex-1 space-y-2">
            {/* Website name skeleton */}
            <div className="h-7 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
            
            {/* URL skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-3 grid gap-3">
        {/* Status bar skeleton */}
        <div className="flex items-center gap-4 mt-2">
          <div className="h-10 flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
          <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
        </div>

        {/* Actions skeleton */}
        <div className="flex justify-end gap-3 mr-2 pt-2 border-t border-border/40">
          <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
          <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}