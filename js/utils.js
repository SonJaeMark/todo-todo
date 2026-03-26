export function escapeHtml(value = "") {
  return value.replace(/[&<>]/g, (match) => {
    if (match === "&") return "&amp;";
    if (match === "<") return "&lt;";
    if (match === ">") return "&gt;";
    return match;
  });
}

export function getTokenExpiry(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const decoded = JSON.parse(atob(payloadBase64));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}
