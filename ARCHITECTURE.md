# Arquitetura

Visão técnica das decisões do projeto. Setup, credenciais e cenários estão no [`README.md`](README.md).

## Visão geral

```
UI (React + shadcn/ui)
  │  hooks de feature (useCart, useCreateOrder, …)
  ▼
TanStack Query ── cache por recurso/usuário, retries, otimismo
  │  queryOptions / mutations (src/api/queries.ts, endpoints.ts)
  ▼
Axios (src/api/http.ts) ── token, X-Cart-Id, timeout, ApiError normalizado
  │                                         socket.io-client (src/realtime/)
  ▼                                                   ▼
────────────────────── rede do navegador ──────────────────────
  ▲                                                   ▲
MSW: handlers REST (src/mocks/handlers)     MSW ws.link + socket.io-binding
  └──────────── banco simulado (src/mocks/db.ts, localStorage) ───┘
```

- **Contratos tipados** em `src/api/contracts.ts`, compartilhados por Axios, MSW e UI. ETH é sempre **string decimal** (cálculos com `decimal.js`); quantidades são inteiras.
- **Mocks só na rede:** componentes, hooks e o Axios não conhecem dados fictícios. Com `VITE_ENABLE_MOCKS=false`, o mesmo código fala com uma API real em `/api`.
- **Roteamento:** TanStack Router com rotas em arquivo (`src/routes`) e code-splitting automático. Filtros, busca, ordenação e página do catálogo ficam nos _search params_, validados com `zod/mini`; valores padrão são removidos da URL. Rotas privadas usam `beforeLoad: requireSession`.

## Contratos REST

Base `/api`. Erros seguem `{ error: { code, message, fields? } }` e viram `ApiError` com `status`, `code` e `isTransient`.

| Recurso              | Endpoints                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Sessão               | `POST /session` (login) · `GET /session` · `DELETE /session` (logout) · `POST /accounts` (cadastro) |
| Catálogo             | `GET /nfts?q&tab&sort&categories&networks&min&max&page` · `GET /nfts/:id` · `GET /nfts/:id/related` |
| Favoritos            | `GET /favorites` · `PUT /favorites/:nftId` · `DELETE /favorites/:nftId`                             |
| Carrinho             | `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:itemId` · `DELETE /cart/items/:itemId`       |
| Cotação              | `POST /quotes` `{ couponCode? }`                                                                    |
| Carteira (simulação) | `POST /wallet/connect` → `sessionId`                                                                |
| Pedidos              | `POST /orders` (header `Idempotency-Key`) · `GET /orders/:id`                                       |
| Perfil               | `GET /profile` · `PATCH /profile` · `POST /profile/password` · `PUT /profile/avatar`                |
| Carteiras            | `GET /wallets` · `PUT /wallets/:slot` (`primary` / `secondary`)                                     |

Códigos de erro e seus usos:

| Código                  | Status  | Situação                                                       |
| ----------------------- | ------- | -------------------------------------------------------------- |
| `VALIDATION_ERROR`      | 400/422 | Campos inválidos, com `fields` para o formulário.              |
| `UNAUTHENTICATED`       | 401     | Sem sessão.                                                    |
| `SESSION_EXPIRED`       | 401     | Sessão expirada.                                               |
| `FORBIDDEN`             | 403     | Sem permissão.                                                 |
| `NOT_FOUND`             | 404     | Recurso inexistente.                                           |
| `CONFLICT`              | 409     | Cadastro com e-mail/usuário existente, carrinho vazio.         |
| `AVAILABILITY_CONFLICT` | 409     | Quantidade acima do disponível na edição.                      |
| `QUOTE_OUTDATED`        | 409     | Preço, disponibilidade, cupom ou taxa mudaram desde a cotação. |
| `IDEMPOTENCY_CONFLICT`  | 409     | Mesma chave com conteúdo diferente.                            |
| `COUPON_INVALID`        | 422     | Cupom inexistente ou fora da regra.                            |
| `COUPON_EXPIRED`        | 422     | Cupom expirado.                                                |
| `WALLET_REJECTED`       | 403     | Usuário recusou a conexão na carteira.                         |
| `WALLET_DISCONNECTED`   | 409     | Carteira desconectou antes do envio.                           |
| `TRANSIENT`             | 503     | Falha temporária.                                              |
| `INTERNAL`              | 500     | Erro inesperado.                                               |

O cliente adiciona dois códigos próprios: `NETWORK_ERROR` e `TIMEOUT`.

**Pedidos e idempotência:**

- Cada tentativa de compra tem uma chave por cotação (`kurio:order-attempt:<quoteId>` no `sessionStorage`).
- O servidor guarda `chave → pedido` e uma _fingerprint_ do corpo. A mesma chave com o mesmo corpo devolve o **mesmo pedido** (200); com corpo diferente, devolve `IDEMPOTENCY_CONFLICT`.
- Antes de criar o pedido, o servidor revalida a cotação: validade de 5 min, versão do carrinho, total recalculado (preço, cupom, taxa) e disponibilidade. Qualquer divergência gera `QUOTE_OUTDATED`.
- O pedido nasce `pending`. A liquidação simulada o leva a `confirmed` ou `declined`, que são estados **terminais**.
- Na confirmação, o servidor:
  - baixa a disponibilidade;
  - remove do carrinho **só** os itens e as quantidades comprados;
  - publica os eventos.
- Na recusa, o carrinho fica intacto.
- O pedido é um snapshot imutável dos itens e valores, e é a fonte do recibo.

## Eventos em tempo real (Socket.IO)

Envelope comum:

```ts
{ id, type, resource: { type: "nft" | "order", id }, version, occurredAt, userId?, data }
```

| Evento          | Público              | `data`           | Efeito no cliente                                                                                                                                    |
| --------------- | -------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nft.updated`   | todos                | `Nft` completo   | Atualiza preço e disponibilidade no detalhe, nas listas do catálogo e nas linhas do carrinho; avisa (toast + live region) se o NFT está no carrinho. |
| `order.updated` | só o dono (`userId`) | `Order` completo | Atualiza o pedido em cache; toast de confirmado ou recusado.                                                                                         |

Regras do cliente (`src/realtime/connection.ts` e `apply-events.ts`):

1. **Duplicatas:** um evento com `id` já visto é descartado (memória dos últimos 500).
2. **Eventos antigos:** a maior `version` aplicada por recurso é registrada; um evento com versão menor ou igual é ignorado. Antes de gravar, a versão também é comparada com a do cache (detalhe, lista e carrinho), para que um evento atrasado não sobrescreva um dado REST mais novo.
3. **Isolamento:** um `order.updated` com `userId` diferente do usuário atual é descartado.
4. **Ciclo de vida:**
   - existe uma conexão por identidade (visitante ou usuário);
   - login, logout ou troca de usuário encerra a conexão e remove todos os listeners antes de abrir a nova;
   - o token vai no `auth` do handshake.

**Origem dos eventos:** são publicados pelas mesmas operações que alteram o banco simulado (liquidação de pedido e ações do painel). Por isso, REST e eventos nunca divergem.

## Reconciliação REST × Socket.IO

- **REST é a fonte da verdade; eventos são atalhos.** Todo evento carrega o recurso completo e versionado, e é aplicado só se for mais novo que o cache.
- **Após reconexão** (não na primeira conexão), o cliente invalida `nfts`, `cart` e os pedidos do usuário. Tudo o que pode ter mudado durante a queda é rebuscado via REST, e um toast informa a recuperação.
- **Pedido pendente:**
  - a página do pedido consulta `GET /orders/:id` a cada 15 s com o tempo real conectado, e a cada 3 s sem ele (fallback);
  - para quando o estado é terminal;
  - refresh ou reconexão recuperam o estado sem nova compra;
  - a liquidação é retomada pelo servidor simulado ao recarregar a página.
- **Checkout:**
  - o resumo vem de `POST /quotes`;
  - se um `nft.updated` altera um item do carrinho, a cotação é refeita e a revisão exige **“Aceitar novos valores”** antes de pagar;
  - o servidor rejeita a cotação desatualizada (`QUOTE_OUTDATED`) mesmo que o evento se perca.

## Sessão

- `POST /session` devolve `{ user, token, expiresAt }`. O token e o `userId` ficam no `localStorage`, e a sessão é recuperada após refresh via `GET /session`.
- O interceptor do Axios envia `Authorization: Bearer`. Um 401 (`SESSION_EXPIRED`/`UNAUTHENTICATED`) dispara `onSessionRejected`, e o `SessionSync`:
  - limpa os dados privados;
  - vai ao login com `redirect` para a tela atual;
  - **mantém o rascunho do checkout** quando o motivo é expiração, para a retomada após o login.
- **Logout e troca de usuário:** removem do cache tudo sob `["user", …]` e `["cart", …]`, apagam rascunhos privados (`sessionStorage`) e reiniciam a conexão Socket.IO.
- **Senhas:** só existem como hash SHA-256 com salt no banco simulado. Credenciais e fixtures são fictícias.
- **Duração da sessão:** configurável (padrão de 24 h; o preset `sessao-curta` usa 1 min).

## Carrinho

- **Visitante:** o servidor cria o carrinho, e o `cartId` volta e é enviado no header `X-Cart-Id` (salvo no `localStorage`). **Usuário:** o carrinho é do usuário.
- **Login com carrinho de visitante:**
  - o servidor **mescla** os itens no carrinho do usuário;
  - respeita a disponibilidade e o limite por linha;
  - descarta o carrinho de visitante.

  O cliente limpa o `cartId` e rebusca.

- **Totais vêm da API:**
  - a linha traz `unitPrice`, `lineTotal`, `available` e `nftVersion`;
  - a cotação traz subtotal, desconto, taxa de rede (0,016 ETH) e total.
- Alterar quantidade é **otimista**: os totais da linha são recalculados com `decimal.js` e voltam ao estado anterior em caso de erro (`use-cart-item-mutation.ts`). Adicionar ou remover espera a API.
- **Cupom:** fica no `sessionStorage` e entra na chave da cotação (`["cart", owner, "quote", cartVersion, coupon]`), então mudar o carrinho ou o cupom gera uma nova cotação.

## Cache, retries e sincronização (TanStack Query)

| Dado               | Chave                                       | `staleTime`                  | Observações                                                       |
| ------------------ | ------------------------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| Catálogo           | `["nfts", "list", search]`                  | 30 s                         | `keepPreviousData` (sem piscar ao paginar/filtrar).               |
| Detalhe            | `["nfts", "detail", id]`                    | 30 s                         | Prefetch no loader sem bloquear a navegação (o skeleton aparece). |
| Relacionados       | `["nfts", "related", id]`                   | 60 s                         |                                                                   |
| Sessão             | `["session"]`                               | 5 min                        | Sem retry; 401 vira “sem sessão”.                                 |
| Carrinho           | `["cart", userId \| "visitor"]`             | 15 s                         |                                                                   |
| Cotação            | `["cart", owner, "quote", version, coupon]` | —                            |                                                                   |
| Favoritos          | `["user", id, "favorites"]`                 | 60 s                         | Otimista com rollback e aviso de erro.                            |
| Perfil / carteiras | `["user", id, …]`                           | 30 s                         |                                                                   |
| Pedido             | `["user", id, "orders", orderId]`           | 0 se pendente, ∞ se terminal | Polling de fallback (ver acima).                                  |

- **Padrões:**
  - `gcTime` de 5 min;
  - refetch ao focar a janela e ao reconectar a rede.
- **Retries:**
  - só para falhas transitórias (rede, timeout, 5xx), até 2 novas tentativas com backoff exponencial de no máximo 4 s;
  - erros 4xx nunca repetem;
  - **mutations nunca repetem automaticamente**, para não duplicar operações. A exceção controlada é o reenvio do pedido após timeout, que usa a **mesma** chave de idempotência.
- **Respostas obsoletas:**
  - toda query passa o `AbortSignal` ao Axios, então trocar de filtro cancela a requisição anterior;
  - como a chave inclui os parâmetros, uma resposta atrasada nunca é exibida para outra busca.
- **Invalidação:**
  - mutations atualizam ou invalidam os recursos afetados (carrinho → cotação, que fica sob a chave do carrinho; pedido concluído → carrinho; a nova disponibilidade dos NFTs chega por `nft.updated`);
  - eventos escrevem direto no cache com guarda de versão.
- **Isolamento:** dados privados ficam sob `["user", userId]`, e o carrinho, sob o dono. Trocar de usuário nunca reaproveita o cache anterior.

## Decisões de UX

- **Revisão do pedido em diálogo** antes de pagar: mostra itens, cupom, taxa e total da cotação atual, conecta a carteira (simulada) e só então envia. Se os valores mudarem, os itens alterados são destacados e é exigida uma nova confirmação explícita.
- **Envio congelado:** depois de “Confirmar e pagar”, o corpo e a cotação enviados ficam fixos. Em caso de timeout, a interface mostra “Verificando…” e reenvia **o mesmo** pedido com a mesma chave, sem depender do estado atual do carrinho.
- **Rascunho do checkout** salvo por usuário no `sessionStorage`. Sobrevive a refresh e à expiração da sessão e é descartado no logout. O preenchimento inicial vem do rascunho, ou, na falta dele, do perfil e da carteira principal.
- **Feedback acessível:**
  - toasts (sonner) com live region para mutations e eventos;
  - o foco vai para o conteúdo principal ao trocar de rota;
  - os diálogos devolvem o foco ao gatilho;
  - há link “Pular para o conteúdo”;
  - skeletons respeitam `prefers-reduced-motion`.
- **Estados explícitos:**
  - catálogo vazio com ação para limpar filtros;
  - erro com “Tentar novamente”;
  - 404 para NFT e para rota inexistente;
  - edição esgotada desabilitada (texto, não só cor);
  - quantidade limitada ao disponível.
- **Links fora do escopo** (Criadores, Aprenda, redes sociais etc.) mostram um aviso de “indisponível” em vez de levar a páginas vazias.
- **Painel de cenários** como aba discreta na borda direita, para não competir com a interface do Figma. Fica oculto nos testes e não existe com `VITE_ENABLE_MOCKS=false`.

## Desvios do Figma

| Item               | Desvio                                                                                                                                        | Motivo                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Ícones             | Lucide no lugar dos ícones do arquivo.                                                                                                        | Biblioteca padrão do shadcn/ui, consistente e acessível; formas equivalentes.                            |
| Checkout mobile    | Seção “Dados do colecionador” agrupada.                                                                                                       | O Figma mobile não detalha todos os campos do desktop; os campos obrigatórios precisam existir nos dois. |
| Linha do carrinho  | Rótulo da edição exibido.                                                                                                                     | O mesmo NFT pode estar no carrinho em edições diferentes.                                                |
| Revisão do pedido  | Diálogo novo.                                                                                                                                 | Requisito de revalidar a cotação, conectar a carteira e confirmar valores alterados.                     |
| Recibo             | Aviso de que o link do Etherscan é simulado.                                                                                                  | A transação é fictícia.                                                                                  |
| Painel de cenários | Aba lateral extra.                                                                                                                            | Ferramenta da simulação, fora do design do produto.                                                      |
| Fonte e imagens    | Fonte do Figma (Roboto Mono) servida localmente via `@fontsource-variable`; artes em WebP responsivo (160–960 px) gerado das artes originais. | Assets locais, sem CDN; performance (LCP) sem perda visual perceptível.                                  |
| Alvos de toque     | Pontos do carrossel com área de 24 px (ponto visual mantido).                                                                                 | WCAG 2.2 (_target size_).                                                                                |

## Performance (Lighthouse)

Resultados completos em [`lighthouse/RESULTS.md`](lighthouse/RESULTS.md) (medianas de 3 medições, build de produção, mocks padrão):

| Perfil  | Página                 | Perf. | A11y | BP  | SEO | LCP    | CLS   | TBT    |
| ------- | ---------------------- | ----- | ---- | --- | --- | ------ | ----- | ------ |
| desktop | `/`                    | 97    | 100  | 100 | 100 | 1,17 s | 0,002 | 26 ms  |
| desktop | `/nft/emerald-ape-042` | 96    | 100  | 100 | 100 | 1,21 s | 0     | 0 ms   |
| mobile  | `/`                    | 70    | 100  | 100 | 100 | 5,57 s | 0,015 | 128 ms |
| mobile  | `/nft/emerald-ape-042` | 65    | 100  | 100 | 100 | 5,10 s | 0,078 | 311 ms |

Accessibility, Best Practices e SEO atingem 100 em todos os casos, e o desktop passa a meta de performance.

**Por que a Performance mobile fica abaixo de 90:** o perfil mobile simula 4G lento (150 ms RTT, 1,6 Mbps) e CPU 4× mais lenta. Nessas condições, o tempo é dominado por JavaScript:

1. **SPA sem HTML pré-renderizado.** Nada é pintado antes de baixar e executar o bundle principal (93 KB gzip), o que leva o FCP a ~3,6 s. O LCP (decoração do banner ou imagem do NFT) depende ainda do chunk da rota e dos dados.
2. **O backend roda no próprio navegador.** O MSW e o banco simulado (~170 KB, ~300 ms de CPU emulada) baixam e executam durante o carregamento, porque os dados da página dependem deles. Em produção, com API real, esse custo não existiria (`VITE_ENABLE_MOCKS=false` o remove do bundle).

**Otimizações aplicadas:**

- a interface renderiza sem esperar o MSW, que inicia em `requestIdleCallback`; as requisições aguardam o mock ficar pronto;
- `zod/mini` nos search params;
- `decimal.js`, Socket.IO e o diálogo de busca fora do bundle inicial (de 124 para 93 KB gzip);
- imagens WebP responsivas com dimensões fixas;
- skeleton do detalhe com altura reservada (CLS de 0,28 para 0).

**Testado e descartado:** embutir a rota inicial no bundle principal para evitar a cascata de chunks. O ganho ficou dentro da variação da medição e o bundle cresceu 23 KB.

**O que resolveria de fato:** pré-renderização ou SSR (HTML pronto na primeira resposta) e uma API real fora do navegador. As duas coisas mudam a arquitetura pedida (SPA com mocks em MSW) e não foram feitas para não otimizar apenas a pontuação.

Sobre a medição: o `scripts/lighthouse.mjs` sobe e encerra o próprio servidor e confere, em cada relatório, que o bundle medido é o do build atual. No Windows, o LHCI deixava o servidor anterior vivo, e rodadas seguintes podiam medir um build antigo.

## Limitações conhecidas

- **Socket.IO simulado:**
  - o `@mswjs/socket.io-binding` não implementa namespaces, rooms nem acks;
  - o heartbeat é enviado manualmente e o cliente usa só o transporte WebSocket (sem long-polling);
  - o servidor usa um host fictício (`realtime.kurio.local`) para não interceptar o WebSocket do HMR do Vite.
- **`socket.io-client` carregado após o MSW:** o `engine.io-client` guarda a referência ao `WebSocket` global ao ser avaliado, então o módulo é importado dinamicamente depois que o MSW assume a rede.
- **Dados por navegador:** o banco simulado vive no `localStorage` de cada navegador. Não há dados compartilhados entre dispositivos, e abas diferentes não recebem eventos umas das outras.
- **Liquidação de pagamentos:**
  - só avança com uma aba aberta (timer no navegador);
  - ao reabrir, pedidos pendentes vencidos são concluídos;
  - sessões de carteira ficam em memória e somem no refresh, como uma extensão real.
- **Service Worker** exige contexto seguro (HTTPS ou `localhost`).
- **Transações e links do Etherscan** são fictícios.
- **Baselines visuais** geradas no Windows; outro sistema operacional pode exigir regenerá-las.
- **Peers:** `msw` fixado na v2 (o binding não suporta a v3); `@hookform/resolvers` instalado com `--legacy-peer-deps`.
