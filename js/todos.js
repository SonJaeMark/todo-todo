import { BASE_URL } from "./config.js";
import { fetchWithAuth } from "./api.js";
import { elements } from "./dom.js";
import { renderTodoList, showTodoMessage } from "./ui.js";

function sortTodos(todos = []) {
  return [...todos].sort((left, right) => Number(left.done === true) - Number(right.done === true));
}

export async function fetchTodos() {
  try {
    const response = await fetchWithAuth(BASE_URL, { method: "GET" });
    if (!response.ok) {
      renderTodoList([]);
      showTodoMessage("could not fetch tasks", true);
      return;
    }

    const todos = await response.json();
    renderTodoList(sortTodos(todos));
  } catch (error) {
    console.error(error);
    renderTodoList([]);
  }
}

export async function createTodo(task) {
  if (!task.trim()) {
    showTodoMessage("task cannot be empty", true);
    return;
  }

  try {
    const response = await fetchWithAuth(`${BASE_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: task.trim() })
    });

    if (!response.ok) {
      showTodoMessage(`create failed: ${await response.text()}`, true);
      return;
    }

    showTodoMessage("task created");
    elements.newTaskInput.value = "";
    await fetchTodos();
  } catch {
    showTodoMessage("network error", true);
  }
}

export async function updateTodoTask(id, newTask) {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: newTask })
    });

    if (!response.ok) {
      showTodoMessage("update failed", true);
      return;
    }

    showTodoMessage("task updated");
    await fetchTodos();
  } catch {
    showTodoMessage("error updating", true);
  }
}

export async function markTodoDone(id) {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/done/${id}`, { method: "PUT" });
    if (!response.ok) {
      showTodoMessage("could not mark done", true);
      return;
    }

    showTodoMessage("marked done");
    await fetchTodos();
  } catch {
    showTodoMessage("error", true);
  }
}

export async function deleteTodo(id) {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/delete/${id}`, { method: "DELETE" });
    if (!response.ok) {
      showTodoMessage("delete failed", true);
      return;
    }

    showTodoMessage("task deleted");
    await fetchTodos();
  } catch {
    showTodoMessage("error", true);
  }
}

export function bindTodoActions() {
  elements.todoListContainer.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;

    const { id } = button.dataset;
    if (button.classList.contains("done-btn")) {
      await markTodoDone(id);
      return;
    }

    if (button.classList.contains("edit-btn")) {
      const nextTask = window.prompt("Edit task description:");
      if (nextTask && nextTask.trim()) {
        await updateTodoTask(id, nextTask.trim());
      }
      return;
    }

    if (button.classList.contains("delete-btn") && window.confirm("Delete this task?")) {
      await deleteTodo(id);
    }
  });
}
