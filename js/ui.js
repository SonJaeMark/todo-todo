import { elements } from "./dom.js";
import { state } from "./state.js";
import { escapeHtml } from "./utils.js";

function clearMessageLater(element, msg, resetClass = "message-bar", delay = 3200) {
  window.setTimeout(() => {
    if (element.innerHTML === msg) {
      element.className = resetClass;
      element.innerHTML = "";
    }
  }, delay);
}

export function showLoadingScreen(message = "Checking API health before opening the login screen...") {
  elements.loadingSection.classList.remove("d-none");
  elements.authSection.classList.add("d-none");
  elements.todoPanel.classList.add("d-none");
  elements.loadingMessage.textContent = message;
}

export function updateLoadingMessage(message) {
  elements.loadingMessage.textContent = message;
}

export function hideLoadingScreen() {
  elements.loadingSection.classList.add("d-none");
}

export function setAuthModeUI(showRegister) {
  elements.registerForm.classList.toggle("d-none", !showRegister);
  elements.loginForm.classList.toggle("d-none", showRegister);
  elements.showRegisterBtn.classList.toggle("btn-dark", showRegister);
  elements.showRegisterBtn.classList.toggle("btn-outline-secondary", !showRegister);
  elements.showLoginBtn.classList.toggle("btn-dark", !showRegister);
  elements.showLoginBtn.classList.toggle("btn-outline-secondary", showRegister);
  resetMessage(elements.authMessage);
}

export function showAuthMessage(message, isError = false) {
  elements.authMessage.innerHTML = message;
  elements.authMessage.className = `message-bar ${isError ? "error-message" : "success-message"}`;
  clearMessageLater(elements.authMessage, message, "message-bar", 3500);
}

export function showTodoMessage(message, isError = false) {
  elements.todoMessage.innerHTML = message;
  elements.todoMessage.className = `message-bar ${isError ? "error-message" : "success-message"}`;
  clearMessageLater(elements.todoMessage, message, "message-bar", 2800);
}

export function resetMessage(element) {
  element.className = "message-bar";
  element.innerHTML = "";
}

export function showLoggedInUI(username) {
  hideLoadingScreen();
  elements.authSection.classList.add("d-none");
  elements.todoPanel.classList.remove("d-none");
  elements.userGreeting.innerHTML = `Hi, ${escapeHtml(username || "user")}`;
}

export function showLoggedOutUI() {
  hideLoadingScreen();
  elements.todoPanel.classList.add("d-none");
  elements.authSection.classList.remove("d-none");
}

export function ensureSessionExpiryModal() {
  if (!elements.sessionExpiryModal || typeof bootstrap === "undefined") {
    return null;
  }

  if (!state.sessionExpiryModal) {
    state.sessionExpiryModal = new bootstrap.Modal(elements.sessionExpiryModal, {
      backdrop: "static",
      keyboard: false
    });
  }

  return state.sessionExpiryModal;
}

export function showSessionExpiryPrompt() {
  const modal = ensureSessionExpiryModal();
  if (!modal || state.sessionExpiryPromptOpen) {
    return;
  }

  state.sessionExpiryPromptOpen = true;
  modal.show();
}

export function hideSessionExpiryPrompt() {
  if (state.sessionExpiryModal) {
    state.sessionExpiryModal.hide();
  }

  state.sessionExpiryPromptOpen = false;
}

export function renderTodoList(todos) {
  if (!todos || todos.length === 0) {
    elements.todoListContainer.innerHTML = '<div class="empty-state">No tasks yet - add one above.</div>';
    return;
  }

  elements.todoListContainer.innerHTML = todos.map((todo) => {
    const isDone = todo.done === true;
    const createdAt = todo.createdAt ? new Date(todo.createdAt).toLocaleString() : "recent";

    return `
      <article class="todo-item">
        <div class="todo-content">
          <div class="todo-task ${isDone ? "is-done" : ""}">${escapeHtml(todo.task || "untitled")}</div>
          <div class="todo-meta">
            <span>${escapeHtml(createdAt)}</span>
            ${isDone ? '<span class="done-badge">done</span>' : '<span class="status-badge">pending</span>'}
          </div>
        </div>
        <div class="todo-actions">
          ${!isDone ? `<button data-id="${todo.id}" class="btn btn-outline-secondary btn-sm done-btn">done</button>` : ""}
          <button data-id="${todo.id}" class="btn btn-outline-secondary btn-sm edit-btn">edit</button>
          <button data-id="${todo.id}" class="btn btn-sm btn-danger-soft delete-btn">delete</button>
        </div>
      </article>
    `;
  }).join("");
}
