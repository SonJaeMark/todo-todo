import { BASE_URL } from "./config.js";
import { clearSession } from "./storage.js";
import { state, setSessionState, clearSessionState } from "./state.js";
import { showLoggedOutUI, setAuthModeUI, showAuthMessage } from "./ui.js";
import { getTokenExpiry } from "./utils.js";
import { persistSession } from "./sessionPersist.js";

let refreshHandler = null;
let postRefreshHandler = null;
let refreshInFlight = null;

export function configureApiHandlers({ onRefreshSuccess, onLogout }) {
  postRefreshHandler = onRefreshSuccess;
  refreshHandler = onLogout;
}

async function logoutViaHandler() {
  if (typeof refreshHandler === "function") {
    await refreshHandler("session expired, login again");
  } else {
    clearSessionState();
    clearSession();
    showLoggedOutUI();
    setAuthModeUI(false);
    showAuthMessage("session expired, login again");
  }
}

export async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        if (!state.refreshToken) {
          await logoutViaHandler();
          return false;
        }

        const response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          // Backend expects the refresh token as a raw string body.
          // (Using JSON here causes the backend to reject the request with 403.)
          headers: { "Content-Type": "text/plain" },
          body: state.refreshToken
        });

        if (!response.ok) {
          await logoutViaHandler();
          return false;
        }

        const data = await response.json();
        if (!data.accessToken) {
          await logoutViaHandler();
          return false;
        }

        setSessionState({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || state.refreshToken,
          username: data.username || state.currentUsername,
          userId: data.userId || state.userId
        });

        persistSession();

        if (typeof postRefreshHandler === "function") {
          await postRefreshHandler();
        }

        return true;
      } catch (error) {
        console.warn("refresh error:", error);
        await logoutViaHandler();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function ensureValidAccessToken() {
  if (!state.refreshToken) return;

  if (!state.accessToken) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error("unauthorized");
    return;
  }

  const accessExpiryMs = getTokenExpiry(state.accessToken);
  if (accessExpiryMs === null || accessExpiryMs <= Date.now()) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error("unauthorized");
  }
}

export async function fetchWithAuth(url, options = {}) {
  const requestOptions = { ...options, headers: { ...(options.headers || {}) } };

  await ensureValidAccessToken();

  if (state.accessToken) {
    requestOptions.headers.Authorization = `Bearer ${state.accessToken}`;
  }

  let response;
  try {
    response = await fetch(url, requestOptions);
  } catch (error) {
    console.warn("fetchWithAuth network error:", error);
    throw error;
  }

  if (response.status !== 403) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    throw new Error("unauthorized");
  }

  const retryOptions = { ...options, headers: { ...(options.headers || {}) } };
  if (state.accessToken) {
    retryOptions.headers.Authorization = `Bearer ${state.accessToken}`;
  }

  try {
    response = await fetch(url, retryOptions);
  } catch (error) {
    console.warn("fetchWithAuth retry network error:", error);
    throw error;
  }

  if (response.status === 403) {
    await logoutViaHandler();
    throw new Error("unauthorized");
  }

  return response;
}

export async function logoutRequest() {
  if (!state.refreshToken) return;

  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: state.refreshToken
    });
  } catch {
    // ignore logout transport errors
  }
}
