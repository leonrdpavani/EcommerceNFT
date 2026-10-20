# NFT Marketplace — Visão geral do desafio

> Documento de referência interna (não é o README da solução). Resume o escopo, a stack e os requisitos obrigatórios do desafio frontend.

## Sobre o projeto

Marketplace de NFTs em **React + TypeScript**, fiel ao layout do Figma (desktop e mobile), com fluxos de descoberta, compra e conta do colecionador. Toda a parte de backend (APIs, autenticação, carteiras, pagamentos e eventos em tempo real) é **simulada com MSW** — sem blockchain, extensões de carteira ou gateways reais.

## Figma

- https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1&p=f&t=ZNp8khPGkakHklJV-0

## Stack

| Responsabilidade | Tecnologia |
| --- | --- |
| Build | Vite |
| Interface / linguagem | React + TypeScript |
| Roteamento | TanStack Router |
| Estado remoto | TanStack Query |
| HTTP | Axios (REST) |
| Tempo real | Socket.IO (`socket.io-client`) |
| Estilo / componentes | Tailwind CSS + shadcn/ui |
| Mocks | MSW + `@mswjs/socket.io-binding` |
| Testes E2E e visuais | Playwright |
| Auditoria | Lighthouse |
| Deploy | Vercel (ou Netlify / Cloudflare Pages) |

## Dependências

```bash
# Projeto base
npm create vite@latest . -- --template react-ts

# Runtime
npm i @tanstack/react-router @tanstack/react-query axios socket.io-client
npm i react-hook-form zod @hookform/resolvers decimal.js

# Tailwind + shadcn/ui
npm i tailwindcss @tailwindcss/vite
npx shadcn@latest init

# Dev
npm i -D @tanstack/router-plugin @tanstack/react-router-devtools @tanstack/react-query-devtools
npm i -D msw@^2 @mswjs/socket.io-binding
npm i -D @playwright/test lighthouse @lhci/cli
npm i -D prettier
npx msw init public --save
npx playwright install chromium
```

Complementares escolhidas (livres pelo enunciado): `react-hook-form` + `zod` (formulários/validação), `decimal.js` (precisão de valores em ETH).

Notas de instalação:
- `msw` fixado em **v2**: `@mswjs/socket.io-binding@0.2` ainda não suporta MSW 3.
- `@hookform/resolvers@6` foi instalado com `--legacy-peer-deps` (conflito em peers opcionais `effect`/`@typeschema`, que não usamos). Com o lockfile, `npm i` funciona normalmente.
- Lint via **oxlint** (padrão do template Vite atual), não ESLint.
- shadcn/ui: base Radix, preset Nova (componentes em `src/components/ui`, alias `@/` → `src/`).

## Telas

Início · Detalhes do NFT · Carrinho · Pagamento · Confirmação · Login · Cadastro · Perfil · Carteiras — todas em desktop e mobile (390 / 768 / 1440 px).

## Requisitos obrigatórios (checklist)

### Catálogo e detalhe
- [ ] Busca, filtros combináveis, ordenação e paginação no estado da URL (sobrevivem a refresh e histórico)
- [ ] Mudança de filtro reinicia a paginação
- [ ] Tratamento de vazio, falha e respostas fora de ordem
- [ ] Detalhe: acesso direto, NFT inexistente, edição indisponível, limite de quantidade
- [ ] Favoritos persistidos por usuário autenticado

### Carrinho
- [ ] Adicionar / alterar / remover respeitando disponibilidade por NFT e edição
- [ ] Persistir após refresh e mesclar itens do visitante ao autenticar
- [ ] Cupom (aplicar/remover, inválido/expirado)
- [ ] Subtotal, desconto, taxa de rede e total vindos da API
- [ ] Refletir mudanças de preço/disponibilidade em tempo real
- [ ] ETH como **string decimal**, quantidades inteiras, cotação da API como referência

### Pagamento e confirmação
- [ ] Validação de campos e etapa de revisão
- [ ] Carteiras cadastradas, seleção de rede, simulação de conexão/recusa/desconexão
- [ ] Revalidar preço, disponibilidade, cupom e taxas antes de confirmar (mudança exige nova confirmação)
- [ ] Idempotência: sem pedidos duplicados (clique repetido / reenvio após timeout)
- [ ] Estados pendente / confirmado / recusado, recuperáveis após refresh ou reconexão
- [ ] Confirmação só para pedido efetivamente confirmado
- [ ] Falha preserva itens; sucesso remove apenas itens e quantidades comprados
- [ ] Recibo é snapshot imutável do pedido

### Conta e sessão
- [ ] Cadastro (com conflito), login, logout e sessão recuperável após refresh
- [ ] Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação
- [ ] Expiração de sessão na navegação e no checkout, preservando contexto
- [ ] Logout / troca de usuário limpa cache privado e subscriptions
- [ ] Validação de cadastro, perfil, senha e carteiras (incluindo erros da API)
- [ ] Credenciais fictícias; nunca armazenar senhas em claro

### Integração e estado
- [ ] Router para rotas, search params e rotas protegidas; Query para queries/mutations/cache; Axios para todo REST
- [ ] Contratos tipados entre transporte, estado e UI
- [ ] Estados de loading, vazio, erro, sucesso e refetch em background
- [ ] Invalidação coerente após mutations e eventos
- [ ] Cancelamento/descarte de respostas obsoletas
- [ ] Isolamento por usuário e por parâmetros de consulta
- [ ] Rotas inexistentes (404) e acesso direto a qualquer tela
- [ ] **Atualização otimista com rollback** em pelo menos uma interação
- [ ] Política de cache, retries e sincronização documentada

### Contratos REST (mínimos)
Sessão/conta · NFTs (lista + detalhe) · Favoritos · Carrinho · Cotação · Pedidos (idempotente) · Perfil · Carteiras.
Erros representados: validação, sessão inválida, sem permissão, não encontrado, conflito de disponibilidade, falha transitória. Mesma chave de idempotência → mesmo pedido; chave reutilizada com conteúdo diferente → conflito.

### Mocking (MSW)
- [ ] Mocks só na camada de rede (nada de dados fictícios em componentes/hooks/Axios)
- [ ] Estado consistente entre todos os recursos, com persistência local e **reset** para cenário conhecido
- [ ] Simulação de lentidão, latência variável, timeout, offline e erros HTTP — configurável e reproduzível
- [ ] Fixtures: variedade para filtros/paginação e **≥ 2 usuários**
- [ ] Cenários determinísticos: sucesso/vazio · latência e fora de ordem · falhas 4xx/5xx/conexão · sessão expirada/não autorizado · conflito de cadastro/validação · cupom inválido/expirado · preço alterado/edição esgotada · timeout pós-criação com recuperação idempotente · pagamento confirmado e recusado
- [ ] Socket.IO mockado via MSW (`@mswjs/socket.io-binding`), exercitando `socket.io-client` de verdade
- [ ] Mocks ativáveis por configuração e presentes no build de demonstração
- [ ] Mudanças nos dados refletidas em REST **e** nos eventos

### Tempo real (Socket.IO)
- [ ] `nft.updated` → preço/disponibilidade em catálogo, detalhe e carrinho
- [ ] `order.updated` → estado do pedido (confirmação/recusa)
- [ ] Eventos com id estável, recurso afetado e versão; tolerar duplicatas e eventos antigos
- [ ] Reconciliação com REST após reconexão
- [ ] Eventos de sessão anterior não afetam outro usuário; listeners liberados no fim do ciclo de vida
- [ ] Cenário: NFT no carrinho muda → UI avisa e atualiza resumo → checkout bloqueia cotação desatualizada
- [ ] Queda de conexão com pedido pendente → recuperar estado sem nova compra (confirmado/recusado são terminais)

### UI, responsividade e acessibilidade
- [ ] Fidelidade ao Figma (tipografia, cores, espaçamentos, imagens); shadcn adaptado à identidade
- [ ] Desktop, tablet e mobile (390 / 768 / 1440)
- [ ] Skeletons com shimmer (catálogo, detalhe, resumo do carrinho), sem layout shift, respeitando `prefers-reduced-motion`
- [ ] Teclado + foco visível; focus trap em dialogs/drawers
- [ ] Semântica, labels e erros associados aos campos; alt text
- [ ] Contraste; estados não dependentes só de cor
- [ ] Feedback acessível (live regions) para mutations e eventos em tempo real
- [ ] Sem overflow horizontal / perda de conteúdo com zoom
- [ ] Assets e fontes disponíveis localmente; substituições documentadas

### Testes (Playwright)
- [ ] Busca/filtros/ordenação/paginação/histórico · detalhe direto e 404 · cadastro/login/expiração/logout/troca de usuário
- [ ] Favoritos com falha e rollback · carrinho/quantidades/cupom/persistência · compra completa até o recibo
- [ ] Pagamento recusado, clique repetido, timeout com recuperação do mesmo pedido
- [ ] Perfil, avatar, senha e carteiras com erros · Socket.IO no checkout · eventos duplicados/antigos, desconexão e pedido pendente
- [ ] Teclado, foco em dialogs, validação · skeletons em carregamento lento, erro e retry
- [ ] Chromium em viewports desktop e mobile
- [ ] Regressão visual (início, detalhe, carrinho, pagamento) com baselines versionadas
- [ ] Estado isolado por teste; controle de relógio, latência e eventos
- [ ] Relatório HTML e traces das falhas

### Performance (Lighthouse)
- [ ] Início e detalhe, mobile e desktop, build otimizado com mocks padrão
- [ ] 3 medições por página/perfil → mediana
- [ ] Metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90
- [ ] Registrar LCP, CLS, TBT; justificar resultados abaixo da meta
- [ ] Config versionada; relatórios HTML/JSON, versões, ambiente e condições

### Entrega
- [ ] Código, lockfile, assets, mocks, fixtures, testes e config de auditoria
- [ ] Deploy público (Vercel recomendado) com mocks e tempo real funcionando; refresh/acesso direto em qualquer rota (SPA rewrites)
- [ ] `README.md`: setup, env vars, credenciais fictícias, seleção/reset de cenários, comandos, como reproduzir falhas
- [ ] Documentar contratos REST e eventos, sessão, carrinho, cache e reconciliação REST × Socket.IO
- [ ] `ARCHITECTURE.md`: limitações, decisões de UX, desvios do Figma
- [ ] Scripts: `dev` (com mocks), `build`, `preview`, `typecheck`, `lint`, `test:e2e`, `lighthouse`
- [ ] Rodar a partir de checkout limpo, sem serviços privados

## Critérios eliminatórios

- Não usar efetivamente a stack obrigatória
- Fluxos principais apenas visuais
- Compra confirmada sem resposta da simulação
- Vazamento de dados entre usuários
- Eventos simulados direto na UI (sem passar pelo `socket.io-client`)
- Ausência de testes E2E executáveis

## Pontuação

Fidelidade visual 20 · Fluxos/UX 20 · Integração e estado 15 · Tempo real 10 · Mocking 10 · Testes 10 · Acessibilidade 5 · Performance 5 · Arquitetura/docs 5 — **Total 100**

