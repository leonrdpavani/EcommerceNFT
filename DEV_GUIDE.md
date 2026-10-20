# Guia de desenvolvimento

> Como a stack funciona e como trabalhar no projeto. Escopo e requisitos do desafio estão em [PROJECT.md](PROJECT.md).

## Base

| Tecnologia | Papel |
| --- | --- |
| **TypeScript** | Linguagem. Superset do JavaScript com tipagem estática; erros de tipo aparecem no editor e no `typecheck`, antes de rodar. |
| **React 19** | Biblioteca de UI. A interface é composta por componentes (`.tsx` = JSX + TypeScript) que reagem a mudanças de estado. |
| **Vite** | Build tool / dev server. Em dev, serve os módulos com HMR (alterações aparecem sem recarregar); no build, gera o bundle otimizado em `dist/`. |

## Interface

| Tecnologia | Papel |
| --- | --- |
| **Tailwind CSS v4** | CSS utility-first: estilos via classes no JSX (`p-4 bg-black rounded-lg`). Tokens do tema (cores, fontes, raios) ficam em `src/index.css` (`@theme`). |
| **shadcn/ui** | Coleção de componentes copiados para o projeto (`src/components/ui`), não uma lib fechada — editamos para seguir o Figma. Adicionar: `npx shadcn add dialog`. |
| **Radix UI** | Primitivos headless que o shadcn usa: acessibilidade, teclado, focus trap em dialogs/drawers. |
| **lucide-react** | Ícones como componentes React. |
| **tw-animate-css / cn** | Animações utilitárias e helper `cn()` para combinar classes condicionalmente. |

## Navegação e dados

| Tecnologia | Papel |
| --- | --- |
| **TanStack Router** | Roteamento type-safe baseado em arquivos (`src/routes/`). Gerencia URL, parâmetros (`/nft/$id`), search params tipados (busca/filtros/página na URL) e guards de rotas autenticadas. |
| **TanStack Query** | Gerenciador de estado remoto (server state). Faz cache das respostas por *query key*, controla loading/erro/retry/refetch, mutations, invalidação de cache e atualização otimista com rollback. |
| **Axios** | Cliente HTTP. Toda chamada REST passa por uma instância única (base URL, interceptors de sessão/erros). O Query decide *quando* buscar; o Axios *faz* a requisição. |
| **Socket.IO (client)** | Conexão bidirecional persistente (WebSocket). O servidor empurra eventos (`nft.updated`, `order.updated`) e o cliente atualiza o cache do Query, sem polling. |

Fluxo típico: **componente → hook do Query → função de API (Axios) → MSW responde → cache → componente re-renderiza**. Eventos de socket entram pelo cliente Socket.IO e atualizam/invalidam o mesmo cache.

## Simulação de backend

| Tecnologia | Papel |
| --- | --- |
| **MSW (Mock Service Worker)** | Intercepta as requisições na camada de rede (Service Worker no navegador) e responde com handlers que simulam a API real — com estado, latência, erros e cenários configuráveis. O app não sabe que é mock. |
| **@mswjs/socket.io-binding** | Extensão do MSW que fala o protocolo Socket.IO, permitindo simular o servidor de eventos em tempo real. |

`public/mockServiceWorker.js` é gerado pelo MSW — não editar.

## Formulários e valores

| Tecnologia | Papel |
| --- | --- |
| **react-hook-form** | Estado e submissão de formulários com poucos re-renders. |
| **zod** | Schemas de validação (e tipos inferidos). Reutilizável em formulários, search params e contratos da API. |
| **@hookform/resolvers** | Conecta schemas zod ao react-hook-form. |
| **decimal.js** | Aritmética decimal exata para valores em ETH (evita `0.1 + 0.2 = 0.30000000000000004`). Valores trafegam como string. |

## Qualidade

| Tecnologia | Papel |
| --- | --- |
| **Playwright** | Testes E2E: automatiza o Chromium, executa fluxos reais, compara screenshots (regressão visual), gera relatório HTML e traces. |
| **@axe-core/playwright** | Auditoria automática de acessibilidade dentro dos testes. |
| **Lighthouse / LHCI** | Auditoria de performance, acessibilidade, boas práticas e SEO; o LHCI roda várias medições e calcula a mediana. |
| **oxlint** | Linter (rápido, em Rust). |
| **prettier** | Formatação de código. |

## Comandos

| Comando | Ação |
| --- | --- |
| `npm install` | Instala dependências (primeira vez / após `git pull`) |
| `npm run dev` | Servidor de desenvolvimento em `http://localhost:5173` |
| `npm run build` | Typecheck + build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | Lint |

Scripts de testes E2E e Lighthouse serão adicionados nas próximas etapas.

## Estrutura

```
src/
  routes/          páginas (TanStack Router, file-based)
  components/      componentes da aplicação
  components/ui/   componentes shadcn (customizados)
  lib/             utilitários
  mocks/           handlers, fixtures e cenários do MSW
public/            assets estáticos + mockServiceWorker.js
```

Alias de import: `@/` → `src/` (ex.: `import { Button } from '@/components/ui/button'`).
