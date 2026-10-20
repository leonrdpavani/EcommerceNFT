/**
 * Dados do cliente que precisam sobreviver ao refresh: token da sessão (nunca a senha)
 * e o identificador do carrinho de visitante.
 */
export interface StoredSession {
  token: string
  userId: string
  expiresAt: string
}

const SESSION_KEY = "kurio:session"
const CART_KEY = "kurio:cart-id"
const PRIVATE_PREFIXES = ["kurio:checkout-draft:", "kurio:order-attempt:", "kurio:coupon"]

function read<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Armazenamento indisponível: a sessão vale só para a aba atual.
  }
}

export const clientStorage = {
  getSession: () => read<StoredSession>(SESSION_KEY),
  setSession: (session: StoredSession | null) => write(SESSION_KEY, session),
  getCartId: () => read<string>(CART_KEY),
  setCartId: (cartId: string | null) => write(CART_KEY, cartId),
  /** Remove rascunhos de checkout, tentativas de pedido e cupom (dados da sessão anterior). */
  clearPrivateDrafts: () => {
    try {
      for (const key of Object.keys(sessionStorage)) {
        if (PRIVATE_PREFIXES.some((prefix) => key.startsWith(prefix))) sessionStorage.removeItem(key)
      }
    } catch {
      // sem sessionStorage
    }
  },
}
