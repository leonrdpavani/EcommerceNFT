import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FlaskConicalIcon, RotateCcwIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { http } from "@/api/http"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PRESETS, type MockConfig } from "@/mocks/config"
import { useRealtimeStatus } from "@/realtime/status"

const CONFIG_KEY = ["__mock", "config"] as const

const OPTIONS: { key: keyof MockConfig; label: string; options: { value: string; label: string }[] }[] = [
  {
    key: "latency",
    label: "Latência",
    options: [
      { value: "none", label: "Nenhuma" },
      { value: "normal", label: "Normal (150–400 ms)" },
      { value: "slow", label: "Lenta (~2,5 s)" },
      { value: "variable", label: "Variável (fora de ordem)" },
    ],
  },
  {
    key: "failure",
    label: "Falhas de rede/HTTP",
    options: [
      { value: "none", label: "Nenhuma" },
      { value: "offline", label: "Sem conexão" },
      { value: "server-error", label: "HTTP 500 em tudo" },
      { value: "transient", label: "503 na 1ª tentativa" },
      { value: "catalog-error", label: "HTTP 500 no catálogo" },
    ],
  },
  {
    key: "payment",
    label: "Pagamento",
    options: [
      { value: "approve", label: "Aprovado" },
      { value: "decline", label: "Recusado" },
    ],
  },
  {
    key: "wallet",
    label: "Carteira",
    options: [
      { value: "connect", label: "Conecta" },
      { value: "refuse", label: "Recusa a conexão" },
      { value: "disconnect", label: "Desconecta antes do envio" },
    ],
  },
  {
    key: "realtime",
    label: "Servidor de tempo real",
    options: [
      { value: "online", label: "Online" },
      { value: "offline", label: "Fora do ar" },
    ],
  },
]

const ACTIONS: { action: string; label: string }[] = [
  { action: "price-change", label: "Alterar preço (item do carrinho)" },
  { action: "sell-out", label: "Esgotar edição do carrinho" },
  { action: "duplicate-event", label: "Reenviar último evento (duplicado)" },
  { action: "stale-event", label: "Enviar evento antigo" },
  { action: "drop-connections", label: "Derrubar conexão em tempo real" },
  { action: "expire-sessions", label: "Expirar sessões agora" },
]

const STATUS_LABEL: Record<string, string> = {
  idle: "inativo",
  connecting: "conectando",
  connected: "conectado",
  reconnecting: "reconectando",
  offline: "sem conexão",
}

/**
 * Painel de cenários da simulação (MSW). Ferramenta de demonstração/QA: altera apenas o
 * servidor simulado, que então responde e emite eventos de acordo — a aplicação não tem
 * nenhum caminho alternativo de negócio para os cenários.
 */
const HIDDEN_KEY = "kurio:scenario-panel-hidden"

function readHidden() {
  try {
    return sessionStorage.getItem(HIDDEN_KEY) === "1"
  } catch {
    return false
  }
}

export function ScenarioPanel() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(readHidden)

  // Atalho para abrir o painel mesmo com a aba oculta: Alt + Shift + C.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.code === "KeyC") setOpen(true)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function hideTrigger() {
    try {
      sessionStorage.setItem(HIDDEN_KEY, "1")
    } catch {
      // sem sessionStorage
    }
    setHidden(true)
    setOpen(false)
    toast.info("Aba de cenários oculta. Use Alt + Shift + C para abrir o painel.")
  }
  const queryClient = useQueryClient()
  const realtime = useRealtimeStatus()
  const config = useQuery({
    queryKey: CONFIG_KEY,
    queryFn: () => http.get<MockConfig>("/__mock/config").then((res) => res.data),
    enabled: open,
    staleTime: 0,
  })

  const save = useMutation({
    mutationFn: (patch: Partial<MockConfig>) => http.put<MockConfig>("/__mock/config", patch).then((res) => res.data),
    onSuccess: (data) => queryClient.setQueryData(CONFIG_KEY, data),
  })

  const action = useMutation({
    mutationFn: (name: string) => http.post(`/__mock/actions/${name}`, {}).then((res) => res.data),
    onSuccess: (_data, name) => toast.info(`Cenário executado: ${ACTIONS.find((item) => item.action === name)?.label}`),
    onError: () => toast.error("Não foi possível executar a ação (verifique o cenário de falhas)."),
  })

  async function applyPreset(id: string) {
    await http.delete("/__mock/config")
    save.mutate(PRESETS[id].config)
  }

  async function resetData() {
    await http.post("/__mock/reset")
    toast.success("Dados restaurados ao cenário inicial.")
    window.setTimeout(() => window.location.reload(), 400)
  }

  return (
    <>
      {hidden ? null : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed top-1/2 right-0 z-40 flex -translate-y-1/2 cursor-pointer flex-col items-center gap-2 rounded-l-md border border-r-0 border-line-soft bg-surface-dark px-1.5 py-3 text-[11px] font-bold text-brand-text shadow-float transition-colors hover:border-brand"
          aria-haspopup="dialog"
          aria-label={`Cenários da simulação (tempo real: ${STATUS_LABEL[realtime]})`}
        >
          <FlaskConicalIcon className="size-4" aria-hidden="true" />
          <span className="[writing-mode:vertical-rl]" aria-hidden="true">
            Cenários
          </span>
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", realtime === "connected" ? "bg-success" : realtime === "idle" ? "bg-taupe" : "bg-coral")}
          />
        </button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Cenários da simulação</SheetTitle>
            <SheetDescription className="text-sand">
              Controla o servidor simulado (MSW). Tempo real: <strong className="text-cream">{STATUS_LABEL[realtime]}</strong>.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-8 px-6 pb-8">
            <section aria-labelledby="presets-title" className="flex flex-col gap-3">
              <h3 id="presets-title" className="text-sm font-bold text-cream">
                Cenários prontos
              </h3>
              <ul className="grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([id, preset]) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => void applyPreset(id)}
                      title={preset.description}
                      className="w-full cursor-pointer rounded-xs border border-line px-3 py-2 text-left text-xs text-cream transition-colors hover:border-brand"
                    >
                      {preset.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="config-title" className="flex flex-col gap-4">
              <h3 id="config-title" className="text-sm font-bold text-cream">
                Ajuste fino
              </h3>
              {config.data
                ? OPTIONS.map((option) => (
                    <div key={option.key} className="flex flex-col gap-1.5">
                      <span id={`cfg-${option.key}`} className="text-xs text-sand">
                        {option.label}
                      </span>
                      <Select value={String(config.data[option.key])} onValueChange={(value) => save.mutate({ [option.key]: value })}>
                        <SelectTrigger aria-labelledby={`cfg-${option.key}`} className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {option.options.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                : null}
              {config.data ? (
                <>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-cream">
                    <input
                      type="checkbox"
                      className="round-check"
                      checked={config.data.orderTimeout}
                      onChange={(event) => save.mutate({ orderTimeout: event.target.checked })}
                    />
                    Timeout na criação do pedido
                  </label>
                  <label className="flex items-center justify-between gap-3 text-sm text-cream">
                    Duração da sessão (min)
                    <input
                      type="number"
                      min={1}
                      value={config.data.sessionMinutes}
                      onChange={(event) => save.mutate({ sessionMinutes: Math.max(1, Number(event.target.value) || 1) })}
                      className="h-9 w-24 rounded-xs border border-line bg-transparent px-2 text-right"
                    />
                  </label>
                </>
              ) : null}
            </section>

            <section aria-labelledby="actions-title" className="flex flex-col gap-3">
              <h3 id="actions-title" className="text-sm font-bold text-cream">
                Eventos e ações
              </h3>
              <div className="flex flex-col gap-2">
                {ACTIONS.map((item) => (
                  <Button
                    key={item.action}
                    variant="secondary"
                    size="sm"
                    className="justify-start"
                    onClick={() => action.mutate(item.action)}
                    disabled={action.isPending}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => void resetData()}>
                <RotateCcwIcon aria-hidden="true" />
                Restaurar dados iniciais
              </Button>
              <Button variant="ghost" size="sm" onClick={hideTrigger}>
                Ocultar aba (Alt + Shift + C reabre)
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
