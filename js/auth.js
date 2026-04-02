import { BASE_URL } from "./config.js";
import { elements } from "./dom.js";
import { loadSession, clearSession } from "./storage.js";
import { state, setSessionState, clearSessionState } from "./state.js";
import { getTokenExpiry } from "./utils.js";
import {
  setAuthModeUI,
  showAuthMessage,
  hideSessionExpiryPrompt,
  showLoggedInUI,
  showLoggedOutUI,
  showTodoMessage,
  showSessionExpiryPrompt
} from "./ui.js";
import { fetchTodos } from "./todos.js";
import { logoutRequest } from "./api.js";
import { persistSession } from "./sessionPersist.js";

function clearRefreshTokenExpiryTimer() {
  if (state.refreshTokenExpiryTimer) {
    clearTimeout(state.refreshTokenExpiryTimer);
    state.refreshTokenExpiryTimer = null;
  }
}

export function promptSessionExpiry() {
  clearRefreshTokenExpiryTimer();
  state.refreshToken = "";
  persistSession();
  showSessionExpiryPrompt();
  showTodoMessage("Session expired. Login again to stay signed in.", true);
}

export function startRefreshTokenExpiryMonitor() {
  clearRefreshTokenExpiryTimer();
  if (!state.refreshToken) return;

  const expiryMs = getTokenExpiry(state.refreshToken);
  if (!expiryMs) return;

  const timeUntilExpiry = expiryMs - Date.now();
  if (timeUntilExpiry <= 0) {
    promptSessionExpiry();
    return;
  }

  state.refreshTokenExpiryTimer = window.setTimeout(() => {
    promptSessionExpiry();
  }, timeUntilExpiry);
}

export function handleLoginSuccess(data) {
  setSessionState({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    username: data.username,
    userId: data.userId
  });

  persistSession();
  hideSessionExpiryPrompt();
  showLoggedInUI(state.currentUsername);
  startRefreshTokenExpiryMonitor();
  fetchTodos();
}

export async function logoutUser(message = "logged out") {
  await logoutRequest();
  clearRefreshTokenExpiryTimer();
  hideSessionExpiryPrompt();
  clearSessionState();
  clearSession();
  showLoggedOutUI();
  setAuthModeUI(false);
  showAuthMessage(message);
}

export async function registerUser() {
  const username = elements.regUsername.value.trim();
  const email = elements.regEmail.value.trim();
  const password = elements.regPassword.value;

  if (!username || !email || !password) {
    showAuthMessage("all fields required", true);
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email })
    });

    const data = await response.json();
    if (!response.ok) {
      showAuthMessage(data.message || "registration failed", true);
      return;
    }

    showAuthMessage(`registered as ${data.username}. Please login.`);
    setAuthModeUI(false);
    elements.loginUsername.value = username;
    elements.loginPassword.value = "";
  } catch {
    showAuthMessage("network error", true);
  }
}

export async function loginUser() {
  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;

  if (!username || !password) {
    showAuthMessage("username & password required", true);
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok || !data.accessToken) {
      showAuthMessage(data.message || "invalid credentials", true);
      return;
    }

    handleLoginSuccess(data);
  } catch {
    showAuthMessage("login error", true);
  }
}

export function restoreSession() {
  const saved = loadSession();
  if (!saved.accessToken || !saved.refreshToken || !saved.username) {
    showLoggedOutUI();
    setAuthModeUI(false);
    return;
  }

  const accessExpiryMs = getTokenExpiry(saved.accessToken);
  const refreshExpiryMs = getTokenExpiry(saved.refreshToken);
  if (!accessExpiryMs || accessExpiryMs <= Date.now() || !refreshExpiryMs) {
    logoutUser("token expired, login again");
    return;
  }

  setSessionState(saved);
  showLoggedInUI(state.currentUsername);
  startRefreshTokenExpiryMonitor();

  if (refreshExpiryMs <= Date.now()) {
    promptSessionExpiry();
    return;
  }

  fetchTodos();
}

export function notifyRefreshSuccess() {
  startRefreshTokenExpiryMonitor();
  showTodoMessage("session renewed");
}

export function handleSessionRelogin() {
  hideSessionExpiryPrompt();
  showLoggedOutUI();
  setAuthModeUI(false);
  elements.loginUsername.value = state.currentUsername || "";
  elements.loginPassword.value = "";
  showAuthMessage("Session expired. Login again to stay signed in.", true);
}
