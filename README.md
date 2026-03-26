# Todo TO DO

A small vanilla JavaScript todo app that connects to a secured backend API.

It includes:

- user registration and login
- JWT-based authentication
- automatic access-token refresh
- refresh-token expiry handling with a re-login popup
- backend health checking before the app opens
- todo create, edit, complete, delete, and list views

## What This Project Is

This frontend is a lightweight task manager UI for the API at:

`https://secured-todo-api.onrender.com/api/todos/v1`

The app waits for the backend health endpoint to report `{"status":"OK"}` before showing the login screen. Once the API is healthy, it restores an existing session if one is saved in `localStorage`; otherwise it shows the login form.

## How The App Works

### 1. Startup flow

When the page loads:

1. `js/app.js` starts the app.
2. The loading screen is shown first.
3. The app repeatedly checks `GET /api/todos/v1/health`.
4. If the response contains `status: "OK"`, the app continues.
5. The app then calls `restoreSession()` from `js/auth.js`.
6. If a saved session is valid, the todo panel opens.
7. If no valid session exists, the login screen is shown.

### 2. Authentication flow

Authentication is handled in `js/auth.js` and `js/api.js`.

- `registerUser()` sends a registration request to `/auth/register`
- `loginUser()` sends credentials to `/auth/login`
- `handleLoginSuccess()` saves the returned tokens and user info
- session data is stored in `localStorage`
- `restoreSession()` tries to resume a previous login

Protected API requests use `apiCall()` in `js/api.js`.

- the access token is attached as a `Bearer` token
- if the backend returns `401`, the app tries `/auth/refresh`
- if refresh succeeds, the original request is retried
- if refresh fails, the user is sent back through the logout/session-expired flow

### 3. Refresh-token expiry flow

The app separately monitors refresh token expiry.

- `startRefreshTokenExpiryMonitor()` schedules a timeout based on the refresh token expiry
- when the refresh token expires, the app opens a popup
- the popup asks the user to log in again
- the user can either:
  - choose `login again` and return to the login screen
  - choose `logout` and clear the session

This keeps the app from silently failing when the refresh token is no longer valid.

### 4. Todo flow

Todo actions are handled in `js/todos.js`.

- `fetchTodos()` loads todos from the backend
- `createTodo()` creates a new task
- `updateTodoTask()` edits a task
- `markTodoDone()` marks a task as complete
- `deleteTodo()` removes a task

Completed tasks are sorted to the bottom before rendering.

## File Overview

- [index.html](/c:/Projects/todo-todo/index.html): main page markup, auth view, todo panel, loading screen, session expiry modal
- [css/styles.css](/c:/Projects/todo-todo/css/styles.css): styling for the app, loading screen, cards, forms, todo list, and modal
- [js/app.js](/c:/Projects/todo-todo/js/app.js): startup logic, health polling, event binding
- [js/config.js](/c:/Projects/todo-todo/js/config.js): API base URL, health URL, storage key names
- [js/auth.js](/c:/Projects/todo-todo/js/auth.js): login, register, logout, session restore, refresh expiry handling
- [js/api.js](/c:/Projects/todo-todo/js/api.js): authenticated API wrapper and token refresh retry logic
- [js/todos.js](/c:/Projects/todo-todo/js/todos.js): todo CRUD behavior and list refresh
- [js/ui.js](/c:/Projects/todo-todo/js/ui.js): UI state changes, messages, rendering, loading and modal helpers
- [js/dom.js](/c:/Projects/todo-todo/js/dom.js): cached DOM element references
- [js/state.js](/c:/Projects/todo-todo/js/state.js): in-memory session state
- [js/storage.js](/c:/Projects/todo-todo/js/storage.js): `localStorage` persistence helpers
- [js/utils.js](/c:/Projects/todo-todo/js/utils.js): small utility helpers like token expiry parsing

## Main Endpoints Used

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /`
- `POST /create`
- `PUT /update/:id`
- `PUT /done/:id`
- `DELETE /delete/:id`

All endpoint paths above are relative to:

`https://secured-todo-api.onrender.com/api/todos/v1`

## Session Storage

The app stores these values in `localStorage`:

- `todo_access`
- `todo_refresh`
- `todo_user`
- `todo_userId`

These values are used to restore the session after refreshes or page reloads.

## Running The Frontend

This project is a static frontend, so you can run it with any simple local server.

Examples:

```powershell
npx serve .
```

or

```powershell
python -m http.server 3000
```

Then open the local URL in a browser.

Important:

- the backend API must be reachable
- the app will stay on the loading screen until `/health` returns `status: "OK"`

## Current Behavior Summary

- shows a loading screen until the backend is healthy
- shows login/register once the API is ready
- restores saved sessions when possible
- refreshes access tokens automatically after `401`
- prompts the user when the refresh token expires
- keeps completed todos at the bottom of the list

