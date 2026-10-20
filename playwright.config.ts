import { defineConfig, devices } from "@playwright/test"

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

/**
 * E2E com os mocks (MSW) ativos. Cada teste roda em um contexto isolado (localStorage
 * próprio), então o banco simulado sempre parte do seed. Relatório HTML + trace em falhas.
 */
export default defineConfig({
  testDir: "./e2e",
  // Baselines de regressão visual versionadas no repositório (sem sufixo de plataforma).
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    // Servidor próprio dos testes (timeout de requisição reduzido para o cenário de timeout).
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_ENABLE_MOCKS: "true", VITE_REQUEST_TIMEOUT_MS: "3000" },
  },
})
