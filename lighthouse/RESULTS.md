# Resultados do Lighthouse

> Gerado por `npm run lighthouse` em 2026-10-20T21:39:51.368Z. Mediana de 3 medições por página e perfil.

## Ambiente e condições

| Item | Valor |
| --- | --- |
| Lighthouse | 12.6.1 (LHCI 0.15.1) |
| Navegador | Chromium do Playwright (chromium-1248), headless |
| Sistema | Windows_NT 10.0.26300 · 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz · 16 GB RAM |
| Node | v24.11.0 |
| Build | `vite build` (produção) servido por `vite preview` · entrada `assets/index-DU0dmA7o.js` |
| Dados | Mocks MSW ativos, cenário padrão |
| Mobile | Emulação padrão do Lighthouse: 4G lento simulado (150 ms RTT, 1,6 Mbps) e CPU 4× mais lenta |
| Desktop | Preset `desktop`: 1350×940, rede cabeada simulada, sem limitação de CPU |

## Categorias (metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90)

| Perfil | Página | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- | --- |
| mobile | `/` | **70** ⚠️ | 100 | 100 | 100 |
| mobile | `/nft/emerald-ape-042` | **65** ⚠️ | 100 | 100 | 100 |
| desktop | `/` | 97 | 100 | 100 | 100 |
| desktop | `/nft/emerald-ape-042` | 96 | 100 | 100 | 100 |

## Métricas (mediana)

| Perfil | Página | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- |
| mobile | `/` | 5568 ms | 0.015 | 128 ms | 3598 ms | 3925 ms |
| mobile | `/nft/emerald-ape-042` | 5098 ms | 0.078 | 311 ms | 3633 ms | 3633 ms |
| desktop | `/` | 1167 ms | 0.002 | 26 ms | 830 ms | 1045 ms |
| desktop | `/nft/emerald-ape-042` | 1213 ms | 0.000 | 0 ms | 831 ms | 929 ms |

## Medições individuais

- **mobile `/`**: #1 P70 A100 BP100 SEO100 (LCP 5568 ms, CLS 0.015, TBT 134 ms) · #2 P69 A100 BP100 SEO100 (LCP 5605 ms, CLS 0.015, TBT 128 ms) · #3 P70 A100 BP100 SEO100 (LCP 5551 ms, CLS 0.015, TBT 113 ms)
- **mobile `/nft/emerald-ape-042`**: #1 P67 A100 BP100 SEO100 (LCP 5062 ms, CLS 0.078, TBT 259 ms) · #2 P64 A100 BP100 SEO100 (LCP 5098 ms, CLS 0.078, TBT 336 ms) · #3 P65 A100 BP100 SEO100 (LCP 5124 ms, CLS 0.078, TBT 311 ms)
- **desktop `/`**: #1 P96 A100 BP100 SEO100 (LCP 1167 ms, CLS 0.002, TBT 37 ms) · #2 P97 A100 BP100 SEO100 (LCP 1186 ms, CLS 0.002, TBT 26 ms) · #3 P97 A100 BP100 SEO100 (LCP 1120 ms, CLS 0.002, TBT 11 ms)
- **desktop `/nft/emerald-ape-042`**: #1 P96 A100 BP100 SEO100 (LCP 1213 ms, CLS 0.000, TBT 0 ms) · #2 P96 A100 BP100 SEO100 (LCP 1215 ms, CLS 0.000, TBT 0 ms) · #3 P96 A100 BP100 SEO100 (LCP 1202 ms, CLS 0.000, TBT 0 ms)

Relatórios completos (HTML e JSON de cada medição): `lighthouse/reports/<perfil>/`.
