import { useEffect, useState } from "react";
import { fetchBackupFile, fetchWithAuth, triggerBrowserDownload, tryFileUrlFromPath } from "../api";
import { useAppContext } from "../context";

export default function AdminBackupManagementPage() {
  const { session, backups, refreshBackups, runAction } = useAppContext();
  const [remarksById, setRemarksById] = useState({});
  const [selectedBackup, setSelectedBackup] = useState(null);

  useEffect(() => {
    refreshBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingBackups = backups.filter((backup) => backup.status === "PENDING");

  const reviewBackup = (backup, status) => {
    const remarks = remarksById[backup.id] || "";
    runAction(async () => {
      await fetchWithAuth(`/api/backups/${backup.id}/review`, session, {
        method: "PATCH",
        body: JSON.stringify({ status, remarks })
      });
      await refreshBackups();
    }, `Backup ${backup.id} ${status}`);
  };

  const downloadOriginal = (backup) =>
    runAction(async () => {
      const { blob, filename } = await fetchBackupFile(`/api/backups/${backup.id}/download`, session);
      triggerBrowserDownload(blob, filename);
    }, `Downloaded original for backup ${backup.id}`);

  const downloadRenewed = (backup) =>
    runAction(async () => {
      const { blob, filename } = await fetchBackupFile(
        `/api/backups/${backup.id}/renewed-download`,
        session
      );
      triggerBrowserDownload(blob, filename);
    }, `Downloaded renewed for backup ${backup.id}`);

  return (
    <>
      <section className="panel">
        <h2>Admin Backup Management</h2>
        <p className="muted">Approve or reject pending backups and inspect backup details in the modal.</p>
      </section>

      <section className="panel">
        <h3>Pending Backups</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Company ID</th>
                <th>File</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingBackups.length === 0 ? (
                <tr>
                  <td colSpan="5" className="muted">
                    No pending backups
                  </td>
                </tr>
              ) : (
                pendingBackups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{backup.id}</td>
                    <td>{backup.company_id}</td>
                    <td className="path-cell">{backup.file_path}</td>
                    <td>
                      <input
                        value={remarksById[backup.id] || ""}
                        onChange={(e) => setRemarksById((prev) => ({ ...prev, [backup.id]: e.target.value }))}
                        placeholder="Required remarks"
                      />
                    </td>
                    <td className="row">
                      <button className="secondary" onClick={() => setSelectedBackup(backup)}>
                        View Backup
                      </button>
                      <button onClick={() => reviewBackup(backup, "APPROVED")}>Approve</button>
                      <button className="danger" onClick={() => reviewBackup(backup, "REJECTED")}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3>All Backups</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Company ID</th>
                <th>Status</th>
                <th>Original</th>
                <th>Renewed</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id}>
                  <td>{backup.id}</td>
                  <td>{backup.company_id}</td>
                  <td>{backup.status}</td>
                  <td className="path-cell">{backup.file_path}</td>
                  <td className="path-cell">{backup.renewed_file_path || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedBackup ? (
        <div className="modal-overlay" onClick={() => setSelectedBackup(null)}>
          <div className="modal-card modal-backup-detail" onClick={(event) => event.stopPropagation()}>
            <h3>Backup #{selectedBackup.id}</h3>
            <dl className="backup-detail-grid">
              <dt>Company ID</dt>
              <dd>{selectedBackup.company_id}</dd>
              <dt>Status</dt>
              <dd>{selectedBackup.status}</dd>
              <dt>Remarks</dt>
              <dd>{selectedBackup.remarks || "—"}</dd>
              <dt>Original file (server path)</dt>
              <dd>
                <code className="path-block">{selectedBackup.file_path}</code>
              </dd>
              <dt>Renewed file (server path)</dt>
              <dd>
                {selectedBackup.renewed_file_path ? (
                  <code className="path-block">{selectedBackup.renewed_file_path}</code>
                ) : (
                  "—"
                )}
              </dd>
            </dl>
            <div className="row modal-actions">
              <button className="secondary" onClick={() => downloadOriginal(selectedBackup)}>
                Download original from server
              </button>
              {selectedBackup.renewed_file_path ? (
                <button className="secondary" onClick={() => downloadRenewed(selectedBackup)}>
                  Download renewed from server
                </button>
              ) : null}
            </div>
            <p className="muted small">
              If the browser runs on the same PC as the server, you can try opening the path directly (often blocked by
              the browser for security):
            </p>
            <div className="row modal-links">
              {tryFileUrlFromPath(selectedBackup.file_path) ? (
                <a href={tryFileUrlFromPath(selectedBackup.file_path)} target="_blank" rel="noopener noreferrer">
                  Try open original path
                </a>
              ) : null}
              {selectedBackup.renewed_file_path && tryFileUrlFromPath(selectedBackup.renewed_file_path) ? (
                <a
                  href={tryFileUrlFromPath(selectedBackup.renewed_file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Try open renewed path
                </a>
              ) : null}
            </div>
            <button onClick={() => setSelectedBackup(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
