import { http, HttpResponse } from "msw"

import { setMockConfig, type MockConfig } from "../config"
import { resetDb } from "../db"
import { API } from "../http-utils"
import { accountHandlers } from "./account"
import { cartHandlers } from "./cart"
import { catalogHandlers } from "./catalog"
import { orderHandlers } from "./orders"
import { sessionHandlers } from "./session"

/** Controle da simulação: reset do cenário e configuração (usado pela UI de cenários e pelos testes). */
const controlHandlers = [
  http.post(`${API}/__mock/reset`, async () => {
    await resetDb()
    return new HttpResponse(null, { status: 204 })
  }),
  http.put(`${API}/__mock/config`, async ({ request }) => {
    setMockConfig((await request.json()) as Partial<MockConfig>)
    return new HttpResponse(null, { status: 204 })
  }),
]

export const handlers = [
  ...controlHandlers,
  ...catalogHandlers,
  ...sessionHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...accountHandlers,
]
