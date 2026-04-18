const SESSION_KEY = "bms_session";

function isJwtExpired(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/**
 * @returns {{ user: object, token: string } | null}
 */
export function loadStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.token || !data?.user) return null;
    if (isJwtExpired(data.token)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { user: data.user, token: data.token };
  } catch {
    return null;
  }
}

export function saveSession(user, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
