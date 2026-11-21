// Centralised auth session storage.
//
// "Remember me" behaviour:
// - remember = true  -> token + user live in localStorage  (survives browser restarts)
// - remember = false -> token + user live in sessionStorage (tab/browser close = logout)
//
// Only the session (token + user profile) is ever stored here. Passwords are
// never persisted to any storage.

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function readFrom(storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeTo(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch {
    // Storage unavailable (private mode / quota) — session simply won't persist.
  }
}

function removeFrom(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    // Ignore — nothing we can do if storage is unavailable.
  }
}

/**
 * Read the stored auth session. Checks localStorage first, then sessionStorage.
 * Returns { token, user } or null when no token is stored.
 */
export function getAuth() {
  const token = readFrom(window.localStorage, TOKEN_KEY) ?? readFrom(window.sessionStorage, TOKEN_KEY)
  if (token === null) return null

  const rawUser = readFrom(window.localStorage, USER_KEY) ?? readFrom(window.sessionStorage, USER_KEY)
  let user = null
  if (rawUser !== null) {
    try {
      user = JSON.parse(rawUser)
    } catch {
      user = null
    }
  }

  return { token, user }
}

/**
 * Persist the auth session.
 * @param {{ token: string, user?: object|null }} auth
 * @param {boolean} remember true -> localStorage, false -> sessionStorage
 */
export function setAuth({ token, user = null }, remember = true) {
  // Clear both storages first so a "remember" flip can never leave an orphan
  // copy of the session behind.
  clearAuth()

  const store = remember ? window.localStorage : window.sessionStorage
  writeTo(store, TOKEN_KEY, token)
  if (user !== null && user !== undefined) {
    writeTo(store, USER_KEY, JSON.stringify(user))
  }
}

/** Remove the session from BOTH storages (guards against orphaned entries). */
export function clearAuth() {
  removeFrom(window.localStorage, TOKEN_KEY)
  removeFrom(window.localStorage, USER_KEY)
  removeFrom(window.sessionStorage, TOKEN_KEY)
  removeFrom(window.sessionStorage, USER_KEY)
}
