# Resultados do Lighthouse

> Gerado por `npm run lighthouse` em 2026-10-20T20:59:51.227Z. Mediana de 3 medições por página e perfil.

## Ambiente e condições

| Item | Valor |
| --- | --- |
| Lighthouse | 12.6.1 (LHCI 0.15.1) |
| Navegador | Chromium do Playwright (chromium-1248), headless |
| Sistema | Windows_NT 10.0.26300 · 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz · 16 GB RAM |
| Node | v24.11.0 |
| Build | `vite build` (produção) servido por `vite preview` · entrada `assets/index-CW9cq9XW.js` |
| Dados | Mocks MSW ativos, cenário padrão |
| Mobile | Emulação padrão do Lighthouse: 4G lento simulado (150 ms RTT, 1,6 Mbps) e CPU 4× mais lenta |
| Desktop | Preset `desktop`: 1350×940, rede cabeada simulada, sem limitação de CPU |

## Categorias (metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90)

| Perfil | Página | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- | --- |
| mobile | `/` | **69** ⚠️ | 100 | 100 | 100 |
| mobile | `/nft/emerald-ape-042` | **64** ⚠️ | 100 | 100 | 100 |
| desktop | `/` | 97 | 100 | 100 | 100 |
| desktop | `/nft/emerald-ape-042` | 96 | 100 | 100 | 100 |

## Métricas (mediana)

| Perfil | Página | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- |
| mobile | `/` | 5575 ms | 0.015 | 151 ms | 3617 ms | 3959 ms |
| mobile | `/nft/emerald-ape-042` | 5135 ms | 0.078 | 337 ms | 3629 ms | 3629 ms |
| desktop | `/` | 1174 ms | 0.002 | 18 ms | 830 ms | 981 ms |
| desktop | `/nft/emerald-ape-042` | 1230 ms | 0.000 | 0 ms | 854 ms | 1008 ms |

## Medições individuais

- **mobile `/`**: #1 P69 A100 BP100 SEO100 (LCP 5524 ms, CLS 0.015, TBT 163 ms) · #2 P68 A100 BP100 SEO100 (LCP 5596 ms, CLS 0.015, TBT 151 ms) · #3 P70 A100 BP100 SEO100 (LCP 5575 ms, CLS 0.015, TBT 122 ms)
- **mobile `/nft/emerald-ape-042`**: #1 P64 A100 BP100 SEO100 (LCP 5148 ms, CLS 0.078, TBT 337 ms) · #2 P69 A100 BP100 SEO100 (LCP 5039 ms, CLS 0.078, TBT 190 ms) · #3 P63 A100 BP100 SEO100 (LCP 5135 ms, CLS 0.078, TBT 351 ms)
- **desktop `/`**: #1 P97 A100 BP100 SEO100 (LCP 1180 ms, CLS 0.002, TBT 22 ms) · #2 P97 A100 BP100 SEO100 (LCP 1166 ms, CLS 0.002, TBT 18 ms) · #3 P97 A100 BP100 SEO100 (LCP 1174 ms, CLS 0.002, TBT 18 ms)
- **desktop `/nft/emerald-ape-042`**: #1 P96 A100 BP100 SEO100 (LCP 1229 ms, CLS 0.000, TBT 0 ms) · #2 P96 A100 BP100 SEO100 (LCP 1230 ms, CLS 0.000, TBT 0 ms) · #3 P96 A100 BP100 SEO100 (LCP 1232 ms, CLS 0.000, TBT 0 ms)

Relatórios completos (HTML e JSON de cada medição): `lighthouse/reports/<perfil>/`.
