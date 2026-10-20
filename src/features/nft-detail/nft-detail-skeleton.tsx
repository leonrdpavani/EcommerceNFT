import { Skeleton } from "@/components/ui/skeleton"

/** Skeleton do detalhe com as mesmas dimensões do conteúdo (evita deslocamento de layout). */
export function NftDetailSkeleton() {
  return (
    <div className="container-page mt-8" role="status" aria-label="Carregando NFT">
      <Skeleton className="h-4 w-40" />
      <div className="mt-3 flex flex-col gap-8 lg:flex-row">
        <div className="flex gap-7">
          <div className="hidden flex-col gap-4 lg:flex">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="size-[100px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full rounded-3xl lg:size-[444px]" />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-2/3" />
        </div>
      </div>
    </div>
  )
}
