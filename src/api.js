const API_BASE = "http://localhost:5000";

export async function loginRequest({ username, password }) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || "Login failed");
  }
  if (!json.user || !json.token) {
    throw new Error("Invalid login response");
  }
  return { user: json.user, token: json.token };
}

/**
 * @param {{ user: object, token: string } | null} session
 */
export async function fetchWithAuth(path, session, options = {}) {
  if (!session?.user || !session?.token) throw new Error("Please login first");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  if (!response.ok) {
    let message = "Request failed";
    if (text) {
      try {
        const err = JSON.parse(text);
        message = err.error || message;
      } catch {
        /* non-JSON error body */
      }
    }
    throw new Error(message);
  }

  if (!text || response.status === 204) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid response from server");
  }
}

/**
 * Multipart ZIP upload (field name: file). Do not set Content-Type — browser sets boundary.
 */
export async function uploadZipWithAuth(path, session, formData) {
  if (!session?.user || !session?.token) throw new Error("Please login first");
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.token}`
    },
    body: formData
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || "Upload failed");
  }
  return json;
}

/**
 * Download a backup file (original or renewed). Returns blob + suggested filename.
 */
export async function fetchBackupFile(path, session) {
  if (!session?.user || !session?.token) throw new Error("Please login first");
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${session.token}`
    }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Download failed");
  }
  const blob = await response.blob();
  const cd = response.headers.get("Content-Disposition");
  let filename = "backup.zip";
  if (cd) {
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd);
    const ascii = /filename="([^"]+)"/i.exec(cd);
    const plain = /filename=([^;]+)/i.exec(cd);
    try {
      if (utf8) filename = decodeURIComponent(utf8[1]);
      else if (ascii) filename = ascii[1];
      else if (plain) filename = plain[1].replace(/^["']|["']$/g, "").trim();
    } catch {
      /* keep default */
    }
  }
  return { blob, filename };
}

export function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Best-effort file:// URL for paths on the same machine as the browser (dev only).
 */
export function tryFileUrlFromPath(absolutePath) {
  if (!absolutePath || typeof absolutePath !== "string") return null;
  const normalized = absolutePath.replace(/\\/g, "/");
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${encodeURI(normalized)}`;
  }
  if (normalized.startsWith("//")) return `file:${encodeURI(normalized)}`;
  if (normalized.startsWith("/")) return `file://${encodeURI(normalized)}`;
  return null;
}
