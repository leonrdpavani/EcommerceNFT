import { Tabs } from "radix-ui"

import { networkLabel } from "@/lib/catalog"
import type { Nft } from "@/types/domain"

const triggerClass =
  "relative cursor-pointer pb-3 text-left text-[17px] leading-4 text-cream transition-colors hover:text-brand-text data-[state=active]:font-bold data-[state=active]:text-brand-text data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-[3px] data-[state=active]:after:rounded-full data-[state=active]:after:bg-brand"

export function DetailTabs({ nft }: { nft: Nft }) {
  return (
    <Tabs.Root defaultValue="detalhes" className="flex flex-col gap-3">
      <Tabs.List aria-label="Informações do NFT" className="flex items-start gap-8 border-b-[0.6px] border-line-soft">
        <Tabs.Trigger value="detalhes" className={triggerClass}>
          Detalhes do NFT
        </Tabs.Trigger>
        <Tabs.Trigger value="avaliacoes" className={triggerClass}>
          Avaliações de colecionadores ({nft.reviewsCount})
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="detalhes" className="flex flex-col gap-3 text-sm leading-6 outline-none">
        <div className="flex flex-col gap-6 text-sand">
          {nft.description.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="font-bold text-cream">Rede:</dt>
            <dd className="text-sand">
              Cunhado na {networkLabel(nft.network)} com procedência imutável e metadados armazenados no IPFS.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-cream">Contrato:</dt>
            <dd className="text-sand">
              Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-cream">Direitos autorais:</dt>
            <dd className="text-sand">{nft.contract} • Contrato inteligente ERC-721 verificado.</dd>
          </div>
        </dl>
      </Tabs.Content>

      <Tabs.Content value="avaliacoes" className="text-sm leading-6 text-sand outline-none">
        <p>
          <strong className="text-cream">Nota média {nft.rating.toFixed(1)} de 5</strong>, com base em{" "}
          {nft.reviewsCount} avaliações de colecionadores verificados.
        </p>
        <p className="mt-2">As avaliações detalhadas não fazem parte desta demonstração.</p>
      </Tabs.Content>
    </Tabs.Root>
  )
}
