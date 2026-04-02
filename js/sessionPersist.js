import { state } from "./state.js";
import { saveSession } from "./storage.js";

export function persistSession() {
  saveSession({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    username: state.currentUsername,
    userId: state.userId
  });
}
