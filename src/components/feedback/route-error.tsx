import { useRouter, type ErrorComponentProps } from "@tanstack/react-router"

import { QueryError } from "@/components/feedback/query-error"

/**
 * Erro inesperado ao renderizar uma tela (fallback do router). Em vez da tela técnica padrão,
 * mostra a mesma mensagem amigável dos demais erros, com nova tentativa que recarrega a rota.
 */
export function RouteError({ reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="container-page py-16">
      <QueryError
        title="Algo deu errado nesta tela"
        message="Não foi possível exibir este conteúdo. Tente novamente; se continuar, recarregue a página."
        onRetry={() => {
          reset()
          void router.invalidate()
        }}
      />
    </div>
  )
}
