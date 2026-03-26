import { STORAGE_KEYS } from "./config.js";

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEYS.accessToken, session.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, session.refreshToken);
  localStorage.setItem(STORAGE_KEYS.user, session.username);
  localStorage.setItem(STORAGE_KEYS.userId, session.userId);
}

export function loadSession() {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken),
    username: localStorage.getItem(STORAGE_KEYS.user),
    userId: localStorage.getItem(STORAGE_KEYS.userId)
  };
}

export function clearSession() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
