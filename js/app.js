import { HEALTH_URL } from "./config.js";
import { elements } from "./dom.js";
import { configureApiHandlers } from "./api.js";
import {
  handleSessionRelogin,
  loginUser,
  logoutUser,
  notifyRefreshSuccess,
  registerUser,
  restoreSession
} from "./auth.js";
import { createTodo, fetchTodos, bindTodoActions } from "./todos.js";
import { setAuthModeUI, showLoadingScreen, updateLoadingMessage } from "./ui.js";

const HEALTH_RETRY_MS = 3000;

function bindEvents() {
  elements.showRegisterBtn.addEventListener("click", () => setAuthModeUI(true));
  elements.showLoginBtn.addEventListener("click", () => setAuthModeUI(false));
  elements.doRegisterBtn.addEventListener("click", registerUser);
  elements.doLoginBtn.addEventListener("click", loginUser);
  elements.logoutBtn.addEventListener("click", () => logoutUser("signed out"));
  elements.sessionLogoutBtn.addEventListener("click", () => logoutUser("signed out"));
  elements.sessionReloginBtn.addEventListener("click", handleSessionRelogin);
  elements.createTodoBtn.addEventListener("click", () => createTodo(elements.newTaskInput.value));
  elements.newTaskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      createTodo(elements.newTaskInput.value);
    }
  });

  bindTodoActions();
}

async function isApiHealthy() {
  try {
    const response = await fetch(HEALTH_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data?.status === "OK";
  } catch {
    return false;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForHealthyApi() {
  showLoadingScreen("Checking API health before opening the login screen...");

  while (true) {
    const healthy = await isApiHealthy();
    if (healthy) {
      updateLoadingMessage("API is healthy. Opening your session...");
      return;
    }

    updateLoadingMessage("API is still waking up. Retrying health check...");
    await wait(HEALTH_RETRY_MS);
  }
}

async function startApp() {
  await waitForHealthyApi();
  restoreSession();
}

configureApiHandlers({
  onRefreshSuccess: async () => {
    notifyRefreshSuccess();
    await fetchTodos();
  },
  onLogout: logoutUser
});

bindEvents();
startApp();
