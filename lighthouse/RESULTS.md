# Resultados do Lighthouse

> Gerado por `npm run lighthouse` em 2026-10-22T00:50:28.923Z. Mediana de 3 medições por página e perfil.

## Ambiente e condições

| Item | Valor |
| --- | --- |
| Lighthouse | 12.6.1 (LHCI 0.15.1) |
| Navegador | Chromium do Playwright (chromium-1248), headless |
| Sistema | Windows_NT 10.0.26300 · 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz · 16 GB RAM |
| Node | v24.11.0 |
| Build | `vite build` (produção) servido por `vite preview` · entrada `assets/index-1vndnZpn.js` |
| Dados | Mocks MSW ativos, cenário padrão |
| Mobile | Emulação padrão do Lighthouse: 4G lento simulado (150 ms RTT, 1,6 Mbps) e CPU 4× mais lenta |
| Desktop | Preset `desktop`: 1350×940, rede cabeada simulada, sem limitação de CPU |

## Categorias (metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90)

| Perfil | Página | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- | --- |
| mobile | `/` | **68** ⚠️ | 100 | 100 | 100 |
| mobile | `/nft/emerald-ape-042` | **67** ⚠️ | 100 | 100 | 100 |
| desktop | `/` | 97 | 100 | 100 | 100 |
| desktop | `/nft/emerald-ape-042` | 96 | 100 | 100 | 100 |

## Métricas (mediana)

| Perfil | Página | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- |
| mobile | `/` | 5598 ms | 0.015 | 195 ms | 3621 ms | 3848 ms |
| mobile | `/nft/emerald-ape-042` | 5063 ms | 0.078 | 249 ms | 3632 ms | 3632 ms |
| desktop | `/` | 1170 ms | 0.002 | 16 ms | 821 ms | 975 ms |
| desktop | `/nft/emerald-ape-042` | 1230 ms | 0.000 | 0 ms | 830 ms | 986 ms |

## Medições individuais

- **mobile `/`**: #1 P66 A100 BP100 SEO100 (LCP 5548 ms, CLS 0.015, TBT 254 ms) · #2 P68 A100 BP100 SEO100 (LCP 5598 ms, CLS 0.015, TBT 171 ms) · #3 P68 A100 BP100 SEO100 (LCP 5603 ms, CLS 0.015, TBT 195 ms)
- **mobile `/nft/emerald-ape-042`**: #1 P67 A100 BP100 SEO100 (LCP 5063 ms, CLS 0.078, TBT 249 ms) · #2 P66 A100 BP100 SEO100 (LCP 5111 ms, CLS 0.078, TBT 267 ms) · #3 P68 A100 BP100 SEO100 (LCP 5028 ms, CLS 0.078, TBT 228 ms)
- **desktop `/`**: #1 P97 A100 BP100 SEO100 (LCP 1179 ms, CLS 0.002, TBT 13 ms) · #2 P97 A100 BP100 SEO100 (LCP 1170 ms, CLS 0.002, TBT 16 ms) · #3 P97 A100 BP100 SEO100 (LCP 1167 ms, CLS 0.002, TBT 23 ms)
- **desktop `/nft/emerald-ape-042`**: #1 P91 A100 BP100 SEO100 (LCP 1625 ms, CLS 0.000, TBT 0 ms) · #2 P96 A100 BP100 SEO100 (LCP 1230 ms, CLS 0.000, TBT 10 ms) · #3 P97 A100 BP100 SEO100 (LCP 1175 ms, CLS 0.000, TBT 0 ms)

Relatórios completos (HTML e JSON de cada medição): `lighthouse/reports/<perfil>/`.
