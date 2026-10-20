// Auditoria Lighthouse: build → 3 medições por página em mobile e desktop → medianas.
// Uso: npm run lighthouse   (relatórios em lighthouse/reports, resumo em lighthouse/RESULTS.md)
import { execFileSync, spawn, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
// fs.rm assíncrono: no Node 24.11 (Windows), rmSync falha em silêncio em caminhos com acento.
import { rm } from "node:fs/promises"
import net from "node:net"
import os from "node:os"
import path from "node:path"

import { chromium } from "@playwright/test"

const ROOT = path.resolve(".")
const REPORTS = path.join(ROOT, "lighthouse", "reports")
const LHCI_DIR = path.join(ROOT, ".lighthouseci")
const VITE_BIN = path.join(ROOT, "node_modules", "vite", "bin", "vite.js")
const LHCI_BIN = path.join(ROOT, "node_modules", "@lhci", "cli", "src", "cli.js")
const PROFILES = ["mobile", "desktop"]
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"]
const METRICS = {
  "largest-contentful-paint": "LCP",
  "cumulative-layout-shift": "CLS",
  "total-blocking-time": "TBT",
  "first-contentful-paint": "FCP",
  "speed-index": "Speed Index",
}
const TARGETS = { performance: 90, accessibility: 95, "best-practices": 95, seo: 90 }

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** Executa um script Node do projeto (sem shell) e falha se ele falhar. */
function runNode(script, args, env) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit", env: { ...process.env, ...env } })
  if (result.status !== 0) throw new Error(`Falha ao executar: ${path.basename(script)} ${args.join(" ")}`)
}

/** Porta TCP livre escolhida pelo sistema operacional. */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/**
 * Sobe o `vite preview` como processo filho direto (sem shell), para que seja encerrado de fato
 * ao fim de cada perfil — o LHCI não encerra o servidor no Windows e rodadas seguintes
 * mediriam um build antigo.
 */
async function startPreview(port) {
  const child = spawn(process.execPath, [VITE_BIN, "preview", "--port", String(port), "--strictPort"], { stdio: "ignore" })
  const base = `http://localhost:${port}`
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error("vite preview encerrou antes de ficar pronto")
    try {
      const response = await fetch(base)
      if (response.ok) return { base, html: await response.text(), stop: () => child.kill() }
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  child.kill()
  throw new Error(`vite preview não respondeu em ${base}`)
}

const entryScript = (html) => html.match(/assets\/index-[\w-]+\.js/)?.[0]

/**
 * Deixa os relatórios prontos para versionar: a página inicial ("/") vira o prefixo "inicio"
 * (em vez de um nome iniciado por hífen) e o manifest passa a usar caminhos relativos,
 * sem expor o diretório local da máquina.
 */
function tidyReports(dir) {
  const rename = (file) => (file.startsWith("-") ? `inicio${file}` : file)
  for (const file of readdirSync(dir)) {
    if (file !== rename(file)) renameSync(path.join(dir, file), path.join(dir, rename(file)))
  }
  const manifestPath = path.join(dir, "manifest.json")
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")).map((entry) => ({
    ...entry,
    url: new URL(entry.url).pathname,
    htmlPath: rename(path.basename(entry.htmlPath)),
    jsonPath: rename(path.basename(entry.jsonPath)),
  }))
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

const skipBuild = process.argv.includes("--skip-build")
if (!skipBuild) {
  const build = spawnSync("npm run build", { stdio: "inherit", shell: true })
  if (build.status !== 0) throw new Error("Falha no build")
}

const expectedEntry = entryScript(readFileSync(path.join(ROOT, "dist", "index.html"), "utf8"))
if (!expectedEntry) throw new Error("Script de entrada não encontrado em dist/index.html")

// Usa o Chromium do Playwright (mesma versão dos testes), sem depender do Chrome instalado.
const chromePath = chromium.executablePath()

await rm(REPORTS, { recursive: true, force: true })
mkdirSync(REPORTS, { recursive: true })

const summary = {}
for (const profile of PROFILES) {
  console.log(`
▶ Lighthouse (${profile})`)
  await rm(LHCI_DIR, { recursive: true, force: true })
  const port = await freePort()
  const preview = await startPreview(port)
  try {
    // Garante que o servidor entrega o build recém-gerado antes de medir.
    if (entryScript(preview.html) !== expectedEntry) {
      throw new Error(`O servidor entregou ${entryScript(preview.html)}, esperado ${expectedEntry}`)
    }
    const env = { LH_PROFILE: profile, LH_BASE_URL: preview.base, CHROME_PATH: chromePath }
    runNode(LHCI_BIN, ["collect", "--config=lighthouse/lighthouserc.cjs"], env)
    runNode(LHCI_BIN, ["upload", "--config=lighthouse/lighthouserc.cjs"], env)
  } finally {
    preview.stop()
  }
  tidyReports(path.join(REPORTS, profile))

  const lhrs = readdirSync(LHCI_DIR)
    .filter((file) => file.startsWith("lhr-") && file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(path.join(LHCI_DIR, file), "utf8")))

  for (const lhr of lhrs) {
    const requested = lhr.audits["network-requests"]?.details?.items?.map((item) => item.url) ?? []
    if (!requested.some((url) => url.endsWith(expectedEntry))) {
      throw new Error(`Medição de ${lhr.finalDisplayedUrl} não carregou ${expectedEntry}`)
    }
    const page = new URL(lhr.finalDisplayedUrl ?? lhr.finalUrl).pathname
    const entry = (summary[`${profile} ${page}`] ??= { profile, page, runs: [] })
    entry.runs.push({
      categories: Object.fromEntries(CATEGORIES.map((id) => [id, Math.round(lhr.categories[id].score * 100)])),
      metrics: Object.fromEntries(Object.keys(METRICS).map((id) => [id, lhr.audits[id].numericValue])),
    })
    entry.lighthouseVersion = lhr.lighthouseVersion
  }
}
await rm(LHCI_DIR, { recursive: true, force: true })

const rows = Object.values(summary).map((entry) => ({
  ...entry,
  median: {
    categories: Object.fromEntries(CATEGORIES.map((id) => [id, median(entry.runs.map((run) => run.categories[id]))])),
    metrics: Object.fromEntries(Object.keys(METRICS).map((id) => [id, median(entry.runs.map((run) => run.metrics[id]))])),
  },
}))

const fmtMetric = (id, value) => (id === "cumulative-layout-shift" ? value.toFixed(3) : `${Math.round(value)} ms`)
const mark = (id, value) => (value >= TARGETS[id] ? `${value}` : `**${value}** ⚠️`)
const lighthouseVersion = rows[0]?.lighthouseVersion ?? "?"
const lhciVersion = execFileSync(process.execPath, [LHCI_BIN, "--version"]).toString().trim()

const markdown = `# Resultados do Lighthouse

> Gerado por \`npm run lighthouse\` em ${new Date().toISOString()}. Mediana de 3 medições por página e perfil.

## Ambiente e condições

| Item | Valor |
| --- | --- |
| Lighthouse | ${lighthouseVersion} (LHCI ${lhciVersion}) |
| Navegador | Chromium do Playwright (${path.basename(path.dirname(path.dirname(chromePath)))}), headless |
| Sistema | ${os.type()} ${os.release()} · ${os.cpus()[0]?.model ?? "CPU"} · ${Math.round(os.totalmem() / 1024 ** 3)} GB RAM |
| Node | ${process.version} |
| Build | \`vite build\` (produção) servido por \`vite preview\` · entrada \`${expectedEntry}\` |
| Dados | Mocks MSW ativos, cenário padrão |
| Mobile | Emulação padrão do Lighthouse: 4G lento simulado (150 ms RTT, 1,6 Mbps) e CPU 4× mais lenta |
| Desktop | Preset \`desktop\`: 1350×940, rede cabeada simulada, sem limitação de CPU |

## Categorias (metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90)

| Perfil | Página | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- | --- |
${rows
  .map(
    (row) => `| ${row.profile} | \`${row.page}\` | ${CATEGORIES.map((id) => mark(id, row.median.categories[id])).join(" | ")} |`
  )
  .join("\n")}

## Métricas (mediana)

| Perfil | Página | ${Object.values(METRICS).join(" | ")} |
| --- | --- | ${Object.keys(METRICS)
  .map(() => "---")
  .join(" | ")} |
${rows
  .map(
    (row) =>
      `| ${row.profile} | \`${row.page}\` | ${Object.keys(METRICS)
        .map((id) => fmtMetric(id, row.median.metrics[id]))
        .join(" | ")} |`
  )
  .join("\n")}

## Medições individuais

${rows
  .map(
    (row) =>
      `- **${row.profile} \`${row.page}\`**: ${row.runs
        .map(
          (run, i) =>
            `#${i + 1} P${run.categories.performance} A${run.categories.accessibility} BP${run.categories["best-practices"]} SEO${run.categories.seo} (LCP ${fmtMetric("largest-contentful-paint", run.metrics["largest-contentful-paint"])}, CLS ${fmtMetric("cumulative-layout-shift", run.metrics["cumulative-layout-shift"])}, TBT ${fmtMetric("total-blocking-time", run.metrics["total-blocking-time"])})`
        )
        .join(" · ")}`
  )
  .join("\n")}

Relatórios completos (HTML e JSON de cada medição): \`lighthouse/reports/<perfil>/\`.
`

writeFileSync(path.join(ROOT, "lighthouse", "RESULTS.md"), markdown)
writeFileSync(path.join(ROOT, "lighthouse", "results.json"), JSON.stringify(rows, null, 2))
console.log(`\n${markdown}`)
if (!existsSync(REPORTS)) process.exit(1)
