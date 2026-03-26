export const state = {
  accessToken: null,
  refreshToken: null,
  currentUsername: null,
  userId: null,
  refreshTokenExpiryTimer: null,
  sessionExpiryModal: null,
  sessionExpiryPromptOpen: false
};

export function setSessionState(session) {
  state.accessToken = session.accessToken ?? null;
  state.refreshToken = session.refreshToken ?? null;
  state.currentUsername = session.username ?? null;
  state.userId = session.userId ?? null;
}

export function clearSessionState() {
  setSessionState({
    accessToken: null,
    refreshToken: null,
    username: null,
    userId: null
  });
}
