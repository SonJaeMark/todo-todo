import { BASE_URL } from "./config.js";
import { clearSession, saveSession } from "./storage.js";
import { state, setSessionState, clearSessionState } from "./state.js";
import { showTodoMessage, showLoggedOutUI, setAuthModeUI, showAuthMessage } from "./ui.js";

let refreshHandler = null;
let postRefreshHandler = null;

export function configureApiHandlers({ onRefreshSuccess, onLogout }) {
  postRefreshHandler = onRefreshSuccess;
  refreshHandler = onLogout;
}

export async function performTokenRefresh() {
  if (!state.refreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: state.refreshToken
    });

    if (!response.ok) throw new Error("refresh failed");

    const data = await response.json();
    if (!data.accessToken) return false;

    setSessionState({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || state.refreshToken,
      username: data.username || state.currentUsername,
      userId: data.userId || state.userId
    });

    saveSession({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      username: state.currentUsername,
      userId: state.userId
    });

    showTodoMessage("Token refreshed automatically");

    if (typeof postRefreshHandler === "function") {
      await postRefreshHandler();
    }

    return true;
  } catch (error) {
    console.warn("refresh error:", error);
    return false;
  }
}

export async function apiCall(url, options = {}, skipRefresh = false) {
  const requestOptions = { ...options, headers: { ...(options.headers || {}) } };

  if (state.accessToken) {
    requestOptions.headers.Authorization = `Bearer ${state.accessToken}`;
  }

  const response = await fetch(url, requestOptions);
  if (response.status !== 401 || skipRefresh) {
    return response;
  }

  const refreshed = await performTokenRefresh();
  if (!refreshed) {
    if (typeof refreshHandler === "function") {
      await refreshHandler("session expired, please login again");
    } else {
      clearSessionState();
      clearSession();
      showLoggedOutUI();
      setAuthModeUI(false);
      showAuthMessage("session expired, please login again");
    }

    throw new Error("unauthorized");
  }

  const retryOptions = { ...options, headers: { ...(options.headers || {}) } };
  retryOptions.headers.Authorization = `Bearer ${state.accessToken}`;
  return fetch(url, retryOptions);
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
