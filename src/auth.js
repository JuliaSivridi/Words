// Google Identity Services – client-side OAuth 2.0
// Access token lives in memory; user profile persisted in localStorage.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const SCOPES = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
].join(' ')

let accessToken = null
let tokenClient = null
let tokenExpiresAt = 0

// Listeners that want to know when auth state changes
const listeners = new Set()

export function onAuthChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  listeners.forEach(fn => fn(getUser()))
}

export function getUser() {
  try {
    const raw = localStorage.getItem('words_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getAccessToken() {
  return accessToken
}

export function isTokenFresh() {
  return accessToken && Date.now() < tokenExpiresAt - 30_000
}

function saveUser(profile) {
  localStorage.setItem('words_user', JSON.stringify(profile))
}

export function signOut() {
  accessToken = null
  tokenExpiresAt = 0
  localStorage.removeItem('words_user')
  google.accounts.oauth2.revoke(getUser()?.email ?? '', () => {})
  notify()
}

// Fetch user profile from Google using the access token
async function fetchProfile(token) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}

// Initialize the token client (call once when GIS is loaded)
function initTokenClient(onSuccess, onError) {
  const user = getUser()
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    hint: user?.email ?? undefined,
    callback: async (response) => {
      if (response.error) {
        onError?.(response.error)
        return
      }
      accessToken = response.access_token
      tokenExpiresAt = Date.now() + (response.expires_in ?? 3600) * 1000

      // If we don't have a saved profile yet, fetch it
      if (!getUser()) {
        try {
          const profile = await fetchProfile(accessToken)
          saveUser({ email: profile.email, name: profile.name, picture: profile.picture })
        } catch {
          // profile fetch failed – still usable
        }
      }
      notify()
      onSuccess?.()
    },
    error_callback: (err) => {
      // popup_closed or other non-error situations are expected
      if (err.type !== 'popup_closed') {
        onError?.(err.type)
      }
    },
  })
}

// Attempt silent sign-in (no UI). Returns a Promise that resolves to true/false.
export function trySilentSignIn() {
  return new Promise((resolve) => {
    if (!window.google?.accounts?.oauth2) {
      resolve(false)
      return
    }
    initTokenClient(
      () => resolve(true),
      () => resolve(false)
    )
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

// Show the Google sign-in popup
export function signInWithPopup() {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded'))
      return
    }
    initTokenClient(
      () => resolve(getUser()),
      (err) => reject(new Error(err ?? 'Sign in failed'))
    )
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

// Re-request token silently when it's about to expire
export async function refreshTokenIfNeeded() {
  if (isTokenFresh()) return true
  return trySilentSignIn()
}

// Wait for GIS script to load, then try silent sign-in
export function initAuth(onReady) {
  function tryInit() {
    if (window.google?.accounts?.oauth2) {
      onReady()
    } else {
      setTimeout(tryInit, 100)
    }
  }
  tryInit()
}
