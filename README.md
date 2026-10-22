# Kurio — Marketplace de NFTs

SPA de marketplace de NFTs (catálogo, detalhe, carrinho, checkout com carteira simulada, recibo, conta) construída para o desafio frontend. Todo o backend é simulado **na camada de rede** pelo MSW, inclusive o servidor Socket.IO, e funciona também no build de produção.

**Stack:** React 19 · TypeScript · Vite · TanStack Router · TanStack Query · Axios · Socket.IO (client) · Tailwind CSS v4 · shadcn/ui · MSW + `@mswjs/socket.io-binding` · Playwright · Lighthouse CI.

Documentos complementares:

- [`ARCHITECTURE.md`](ARCHITECTURE.md): contratos REST e eventos, sessão, carrinho, cache, reconciliação REST × Socket.IO, limitações, decisões de UX e desvios do Figma.
- [`DEV_GUIDE.md`](DEV_GUIDE.md): como o projeto está organizado e como desenvolver nele.
- [`lighthouse/RESULTS.md`](lighthouse/RESULTS.md): última auditoria de performance.

---

## Setup

Requisitos: **Node 20.19+ ou 22.12+** (testado com Node 24) e npm.

```bash
npm ci                                  # dependências exatas do lockfile
npx playwright install chromium         # navegador dos testes (também usado pelo Lighthouse)
npm run dev                             # http://localhost:5173, com mocks ativos
```

Não há serviços externos nem chaves privadas: um checkout limpo roda sozinho.

> As dependências foram instaladas com `--legacy-peer-deps` por causa de um _peer_ opcional desatualizado de `@hookform/resolvers`. O `npm ci` respeita o lockfile e funciona normalmente. O `msw` está fixado na v2, porque o `@mswjs/socket.io-binding` ainda não suporta a v3.

## Variáveis de ambiente

Todas são opcionais (arquivo `.env.local` ou variáveis do shell no build).

| Variável                  | Padrão                         | Efeito                                                                                  |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS`       | ativo                          | `"false"` desliga o MSW e o painel de cenários (para apontar a uma API real em `/api`). |
| `VITE_REQUEST_TIMEOUT_MS` | `10000`                        | Timeout das requisições REST (Axios). Os testes usam `3000`.                            |
| `VITE_REALTIME_URL`       | `https://realtime.kurio.local` | URL do servidor Socket.IO. O host padrão é fictício e interceptado pelo MSW.            |

## Comandos

| Comando                      | O que faz                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`                | Servidor de desenvolvimento com mocks.                                                                                                                                                                 |
| `npm run build`              | Typecheck + build de produção em `dist/` (os mocks vão junto).                                                                                                                                         |
| `npm run preview`            | Serve o `dist/` localmente.                                                                                                                                                                            |
| `npm run typecheck`          | `tsc -b`.                                                                                                                                                                                              |
| `npm run lint`               | oxlint.                                                                                                                                                                                                |
| `npm run test:e2e`           | Todos os testes Playwright (desktop 1440×900 e mobile Pixel 7), incluindo axe e regressão visual. Sobe o próprio servidor na porta 4173.                                                               |
| `npm run test:e2e:ui`        | Modo interativo do Playwright.                                                                                                                                                                         |
| `npm run test:e2e:report`    | Abre o relatório HTML da última execução (traces das falhas incluídos).                                                                                                                                |
| `npm run test:visual`        | Só a regressão visual (início, detalhe, carrinho, pagamento).                                                                                                                                          |
| `npm run test:visual:update` | Regenera as baselines em `e2e/__screenshots__/` (revise o diff antes de versionar).                                                                                                                    |
| `npm run lighthouse`         | Build + auditoria Lighthouse (início e detalhe · mobile e desktop · 3 medições → mediana). Gera `lighthouse/RESULTS.md`, `lighthouse/results.json` e os relatórios HTML/JSON em `lighthouse/reports/`. |
| `npm run images`             | Regenera as variantes WebP responsivas das artes dos NFTs.                                                                                                                                             |

## Credenciais e dados de teste (fictícios)

| Usuário           | E-mail            | Senha       | Observações                                                               |
| ----------------- | ----------------- | ----------- | ------------------------------------------------------------------------- |
| Ana Colecionadora | `ana@kurio.dev`   | `Kurio2026` | Carteira principal cadastrada, 2 favoritos. O checkout já vem preenchido. |
| Bruno Criador     | `bruno@kurio.dev` | `Kurio2026` | Sem carteiras nem favoritos (bom para testar validação do checkout).      |

As senhas são guardadas apenas como **hash SHA-256 com salt** no banco simulado; nenhuma senha fica em claro no armazenamento. Também é possível criar contas novas em `/cadastro` (conflito de e-mail ou usuário é simulado).

**Cupons:**

| Código         | Resultado                                                               |
| -------------- | ----------------------------------------------------------------------- |
| `KURIO10`      | 10% de desconto.                                                        |
| `GENESIS`      | 0,5 ETH de desconto em pedidos acima de 2 ETH (abaixo disso, inválido). |
| `VERAO2025`    | Expirado.                                                               |
| qualquer outro | Inválido.                                                               |

**Checkout com dados válidos** (preenchidos automaticamente para a Ana):

| Campo                          | Exemplo válido                               | Regra                            |
| ------------------------------ | -------------------------------------------- | -------------------------------- |
| Endereço da carteira           | `0xA91F3c5D7e21B4a09f8E3d6C2b17E5a4F0c9E82C` | `0x` + 40 hexadecimais           |
| Carteira secundária (opcional) | `nova.kurio.eth` ou outro `0x…`              | endereço 0x ou nome ENS          |
| Código de indicação            | `KURIO-ANA`                                  | 4–16 letras, números ou hífen    |
| Nome ENS                       | `ana` (+ `.eth`)                             | 3–32 letras, números ou hífen    |
| Nome de usuário                | `ana.coleciona`                              | 3–20 letras, números, `.` ou `_` |

A transação do recibo é fictícia: o link do Etherscan abre a página real, que mostra “não encontrada”. Isso é esperado e está avisado na própria tela.

## Cenários (simulação de backend)

O estado do backend simulado é persistido em `localStorage` (`kurio:mock-db`) e sobrevive a refresh. A configuração do cenário fica em `kurio:mock-config`.

### Painel de cenários

Aba vertical na borda direita da tela (ou **Alt+Shift+C**). O painel tem:

- **Cenários prontos:** um clique aplica o preset.
- **Controles finos:** latência, falhas, pagamento, carteira, servidor de tempo real, timeout na criação do pedido e duração da sessão.
- **Ações em tempo real:**
  - alterar o preço de um item do carrinho;
  - esgotar a edição de um item do carrinho;
  - reenviar o último evento (duplicado);
  - enviar evento antigo;
  - derrubar a conexão em tempo real;
  - expirar sessões agora.
- **Restaurar dados iniciais:** reset completo do banco e da configuração, voltando ao cenário conhecido.
- **Ocultar aba:** esconde a aba lateral; **Alt+Shift+C** continua abrindo o painel.

### Por URL

Abra qualquer rota com `?cenario=<id>`, por exemplo `http://localhost:5173/?cenario=lento`:

| `cenario`             | Efeito                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `padrao`              | Rede normal (150–400 ms), pagamento aprovado.                                                 |
| `lento`               | Respostas em ~2,5 s (skeletons visíveis).                                                     |
| `fora-de-ordem`       | Sequência fixa de atrasos diferentes: respostas chegam fora de ordem.                         |
| `offline`             | Todas as requisições falham por rede.                                                         |
| `erro-servidor`       | HTTP 500 em tudo.                                                                             |
| `instavel`            | A 1ª tentativa de cada rota falha com 503; o retry automático recupera.                       |
| `catalogo-erro`       | Só o catálogo responde 500.                                                                   |
| `pagamento-recusado`  | A carteira recusa a transação (pedido termina recusado).                                      |
| `carteira-recusa`     | O usuário recusa conectar a carteira.                                                         |
| `carteira-desconecta` | A carteira desconecta antes do envio do pedido.                                               |
| `timeout-pedido`      | O pedido é criado, mas a resposta excede o timeout; a nova tentativa recupera o mesmo pedido. |
| `tempo-real-offline`  | O servidor Socket.IO recusa conexões; o cliente tenta reconectar.                             |
| `sessao-curta`        | Sessões expiram em 1 minuto.                                                                  |

Todos os cenários são determinísticos (sem sorteio).

### Endpoints de controle (usados pelos testes)

`POST /api/__mock/reset` · `GET|PUT|DELETE /api/__mock/config` · `GET /api/__mock/realtime/clients` · `POST /api/__mock/actions/:action` (`price-change`, `sell-out`, `duplicate-event`, `stale-event`, `drop-connections`, `expire-sessions`).

## Como reproduzir as falhas

Comece com **Restaurar dados iniciais** no painel. Depois:

| Situação                                | Passos                                                                                                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skeletons / carregamento lento          | `?cenario=lento` e navegue entre início e detalhe.                                                                                                                                                                          |
| Respostas fora de ordem                 | `?cenario=fora-de-ordem` e digite rápido na busca ou troque filtros: vale sempre a última busca.                                                                                                                            |
| Erro e nova tentativa                   | `?cenario=catalogo-erro` mostra o erro; volte ao cenário **Padrão** no painel e clique em “Tentar novamente”.                                                                                                               |
| Retry automático                        | `?cenario=instavel`: o catálogo carrega após uma falha 503 invisível ao usuário.                                                                                                                                            |
| Favorito com rollback                   | Entre como Ana, ative **HTTP 500 em tudo** no painel e clique no coração: o estado volta e um aviso aparece.                                                                                                                |
| Sessão expirada no checkout             | Entre, vá a `/pagamento`, preencha algo, use **Expirar sessões agora** no painel e confirme: você vai ao login e, ao voltar, o preenchimento é retomado.                                                                    |
| Troca de usuário                        | Entre como Ana, saia, entre como Bruno: nenhum dado da Ana aparece.                                                                                                                                                         |
| Preço muda no checkout                  | Com itens no carrinho, abra a revisão do pedido e use **Alterar preço (item do carrinho)** no painel: a revisão avisa e exige “Aceitar novos valores”.                                                                      |
| Edição esgota                           | **Esgotar edição do carrinho** com o item no carrinho: aviso, resumo atualizado e checkout bloqueado.                                                                                                                       |
| Eventos duplicados/antigos              | **Reenviar último evento (duplicado)** / **Enviar evento antigo**: nada regride.                                                                                                                                            |
| Pagamento recusado                      | `?cenario=pagamento-recusado` e conclua uma compra: pedido recusado, itens continuam no carrinho.                                                                                                                           |
| Clique repetido                         | Clique várias vezes em “Confirmar e pagar”: um único pedido.                                                                                                                                                                |
| Timeout com recuperação                 | `?cenario=timeout-pedido` e conclua a compra: a interface mostra “Verificando…” e reenvia com a mesma chave de idempotência, recuperando o mesmo pedido.                                                                    |
| Queda do tempo real com pedido pendente | Confirme uma compra e use **Derrubar conexão em tempo real** antes da liquidação: o cliente reconecta, reconcilia via REST e mostra o estado final sem nova compra. Recarregar a página do pedido também recupera o estado. |
| Carteira                                | `?cenario=carteira-recusa` ou `?cenario=carteira-desconecta` e tente pagar.                                                                                                                                                 |
| 404                                     | `/nft/nao-existe` ou qualquer rota inexistente.                                                                                                                                                                             |

Cada uma dessas situações também está coberta por um teste em `e2e/` (veja os nomes dos testes em `npm run test:e2e:ui`).

## Testes

- **E2E (`e2e/*.spec.ts`):** catálogo, detalhe, carrinho, compra, conta, tempo real, resiliência, acessibilidade (axe, WCAG 2.2 AA), teclado/foco/zoom e regressão visual. Cada teste começa com banco e configuração resetados (estado isolado), latência zero e liquidação de pagamento em 800 ms. Os testes controlam latência, falhas e eventos pelos endpoints de controle.
- **Projetos:** `desktop` (1440×900) e `mobile` (Pixel 7). Alguns testes são exclusivos de um viewport e aparecem como _skipped_ no outro.
- **Regressão visual:** baselines versionadas em `e2e/__screenshots__/visual.spec.ts/{desktop,mobile}/`. Foram geradas no Windows; em outro sistema operacional, diferenças de renderização de fontes podem exigir `npm run test:visual:update`.
- **Falhas:** o relatório HTML (`npm run test:e2e:report`) inclui screenshot e trace de cada teste que falhou.

## Lighthouse

`npm run lighthouse` faz o build e, para cada perfil:

- sobe um `vite preview` próprio em uma porta livre;
- confere que o servidor entrega o build recém-gerado;
- roda 3 medições por página;
- encerra o servidor.

Resumo atual (medianas; detalhes, ambiente e justificativa em [`lighthouse/RESULTS.md`](lighthouse/RESULTS.md) e no [`ARCHITECTURE.md`](ARCHITECTURE.md#performance-lighthouse)):

| Perfil  | Página  | Perf. | A11y | BP  | SEO |
| ------- | ------- | ----- | ---- | --- | --- |
| desktop | início  | 97    | 100  | 100 | 100 |
| desktop | detalhe | 96    | 100  | 100 | 100 |
| mobile  | início  | 68    | 100  | 100 | 100 |
| mobile  | detalhe | 67    | 100  | 100 | 100 |

## Deploy

É uma SPA estática: build `npm run build`, saída `dist/`. Os mocks e o tempo real vão no build, sem variáveis de ambiente obrigatórias.

Refresh e acesso direto a qualquer rota exigem reescrever as rotas para `index.html`. A configuração já está versionada (arquivos reais, como assets e `mockServiceWorker.js`, têm prioridade):

- **Vercel:** `vercel.json`.
- **Netlify / Cloudflare Pages:** `public/_redirects` (copiado para o `dist/`).
