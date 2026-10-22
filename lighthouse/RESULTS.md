# Resultados do Lighthouse

> Gerado por `npm run lighthouse` em 2026-10-22T01:53:49.133Z. Mediana de 3 medições por página e perfil.

## Ambiente e condições

| Item | Valor |
| --- | --- |
| Lighthouse | 12.6.1 (LHCI 0.15.1) |
| Navegador | Chromium do Playwright (chromium-1248), headless |
| Sistema | Windows_NT 10.0.26300 · 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz · 16 GB RAM |
| Node | v24.11.0 |
| Build | `vite build` (produção) servido por `vite preview` · entrada `assets/index-CMpMU_bB.js` |
| Dados | Mocks MSW ativos, cenário padrão |
| Mobile | Emulação padrão do Lighthouse: 4G lento simulado (150 ms RTT, 1,6 Mbps) e CPU 4× mais lenta |
| Desktop | Preset `desktop`: 1350×940, rede cabeada simulada, sem limitação de CPU |

## Categorias (metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90)

| Perfil | Página | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- | --- |
| mobile | `/` | **68** ⚠️ | 100 | 100 | 100 |
| mobile | `/nft/emerald-ape-042` | **68** ⚠️ | 100 | 100 | 100 |
| desktop | `/` | 97 | 100 | 100 | 100 |
| desktop | `/nft/emerald-ape-042` | 96 | 100 | 100 | 100 |

## Métricas (mediana)

| Perfil | Página | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- |
| mobile | `/` | 5521 ms | 0.015 | 175 ms | 3670 ms | 3982 ms |
| mobile | `/nft/emerald-ape-042` | 5115 ms | 0.078 | 229 ms | 3637 ms | 3637 ms |
| desktop | `/` | 1171 ms | 0.002 | 16 ms | 835 ms | 944 ms |
| desktop | `/nft/emerald-ape-042` | 1211 ms | 0.000 | 0 ms | 840 ms | 973 ms |

## Medições individuais

- **mobile `/`**: #1 P63 A100 BP100 SEO100 (LCP 5687 ms, CLS 0.015, TBT 317 ms) · #2 P68 A100 BP100 SEO100 (LCP 5521 ms, CLS 0.015, TBT 169 ms) · #3 P69 A100 BP100 SEO100 (LCP 5499 ms, CLS 0.015, TBT 175 ms)
- **mobile `/nft/emerald-ape-042`**: #1 P66 A100 BP100 SEO100 (LCP 5115 ms, CLS 0.078, TBT 289 ms) · #2 P69 A100 BP100 SEO100 (LCP 5129 ms, CLS 0.078, TBT 168 ms) · #3 P68 A100 BP100 SEO100 (LCP 5077 ms, CLS 0.078, TBT 229 ms)
- **desktop `/`**: #1 P97 A100 BP100 SEO100 (LCP 1171 ms, CLS 0.002, TBT 7 ms) · #2 P96 A100 BP100 SEO100 (LCP 1186 ms, CLS 0.002, TBT 17 ms) · #3 P97 A100 BP100 SEO100 (LCP 1154 ms, CLS 0.002, TBT 16 ms)
- **desktop `/nft/emerald-ape-042`**: #1 P97 A100 BP100 SEO100 (LCP 1173 ms, CLS 0.000, TBT 0 ms) · #2 P96 A100 BP100 SEO100 (LCP 1212 ms, CLS 0.000, TBT 0 ms) · #3 P96 A100 BP100 SEO100 (LCP 1211 ms, CLS 0.000, TBT 1 ms)

Relatórios completos (HTML e JSON de cada medição): `lighthouse/reports/<perfil>/`.
