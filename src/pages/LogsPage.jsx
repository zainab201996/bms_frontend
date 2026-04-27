import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "../api";
import { useAppContext } from "../context";

export default function LogsPage() {
  const { session, runAction } = useAppContext();
  const [logs, setLogs] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const loadLogs = useCallback(async () => {
    if (!session) return;
    setLoadError(null);
    const data = await fetchWithAuth("/api/logs", session);
    setLogs(data.logs || []);
  }, [session]);

  useEffect(() => {
    loadLogs().catch((err) => setLoadError(err.message));
  }, [loadLogs]);

  return (
    <section className="panel">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Audit Trail</h2>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            runAction(async () => {
              await loadLogs();
            }, "Logs refreshed")
          }
        >
          Refresh
        </button>
      </div>

      {loadError ? <p className="muted" role="alert">{loadError}</p> : null}

      <div className="table-wrap table-wrap--spaced">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>Metadata</th>
              <th>Performed by</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No log entries yet.
                </td>
              </tr>
            ) : (
              logs.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>
                    <code className="log-action">{row.action || "—"}</code>
                  </td>
                  <td>
                    <code className="log-metadata">{formatMetadata(row.metadata)}</code>
                  </td>
                  <td>{formatPerformedBy(row)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatTime(row.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatTime(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function formatPerformedBy(row) {
  const p = row.performedBy;
  if (!p || p.id == null) return "—";
  const label = p.name || p.username || `#${p.id}`;
  return `${label} (${p.type || "?"})`;
}

function formatMetadata(meta) {
  if (meta == null || (meta.id == null && !meta.table)) {
    return "—";
  }
  if (meta.table != null && meta.id != null) {
    return `${meta.table} · id ${meta.id}`;
  }
  if (meta.id != null) {
    return `id ${meta.id}`;
  }
  return String(meta.table || "—");
}
