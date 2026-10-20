/**
 * Endereço do servidor Socket.IO. Por padrão um host dedicado e fictício: com os mocks
 * ativos o MSW intercepta a conexão antes da rede (e não toca no WebSocket do HMR do Vite).
 * Em produção com backend real, defina VITE_REALTIME_URL.
 */
export const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || "https://realtime.kurio.local"

/** O mesmo endereço no esquema WebSocket, usado pelo `ws.link` do MSW. */
export const REALTIME_WS_URL = `${REALTIME_URL.replace(/^http/, "ws").replace(/\/$/, "")}/`
