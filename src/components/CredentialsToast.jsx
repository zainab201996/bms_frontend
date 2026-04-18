import { useEffect, useState, useCallback } from "react";

export default function CredentialsToast({ open, title, users, onClose }) {
  const [copiedHint, setCopiedHint] = useState("");

  const copyLine = useCallback(async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHint(`${label} copied`);
      setTimeout(() => setCopiedHint(""), 2000);
    } catch {
      setCopiedHint("Copy failed — select text manually");
    }
  }, []);

  const copyAll = useCallback(async () => {
    if (!users?.length) return;
    const blocks = users.map(
      (u) =>
        `Name: ${u.name}\nEmail: ${u.email}\nType: ${u.type}\nUsername: ${u.username}\nPassword: ${u.password}`
    );
    await copyLine("All credentials", blocks.join("\n\n---\n\n"));
  }, [users, copyLine]);

  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => {
      onClose();
    }, 60000);
    return () => clearTimeout(id);
  }, [open, onClose]);

  if (!open || !users?.length) return null;

  return (
    <div className="toast-overlay" role="dialog" aria-modal="true" aria-labelledby="credentials-toast-title">
      <div className="toast-card">
        <div className="toast-header">
          <h3 id="credentials-toast-title">{title}</h3>
          <button type="button" className="toast-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="muted toast-sub">Save these credentials now — the password cannot be retrieved later.</p>
        {copiedHint ? <p className="toast-copied">{copiedHint}</p> : null}
        <ul className="toast-list">
          {users.map((u) => (
            <li key={`${u.id}-${u.username}`} className="toast-user-block">
              <div className="toast-row toast-row--simple">
                <span className="toast-k">Name</span>
                <span className="toast-v">{u.name}</span>
              </div>
              <div className="toast-row">
                <span className="toast-k">Username</span>
                <code className="toast-v">{u.username}</code>
                <button
                  type="button"
                  className="secondary toast-copy"
                  onClick={() => copyLine("Username", u.username)}
                >
                  Copy
                </button>
              </div>
              <div className="toast-row">
                <span className="toast-k">Password</span>
                <code className="toast-v">{u.password}</code>
                <button
                  type="button"
                  className="secondary toast-copy"
                  onClick={() => copyLine("Password", u.password)}
                >
                  Copy
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="toast-actions">
          <button type="button" onClick={copyAll}>
            Copy all to clipboard
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
