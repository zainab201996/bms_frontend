import { useMemo, useOptimistic, useState } from "react";
import { useAppContext } from "../context";
import { fetchBackupFile, triggerBrowserDownload } from "../api";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 4v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="m8.5 10.5 3.5 3.5 3.5-3.5M5 18h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function BackupList() {
  const { backups, currentUser, session, runAction } = useAppContext();
  const [optimisticBackups] = useOptimistic(backups, (current) => current);
  const [selectedBackupId, setSelectedBackupId] = useState(null);

  const visible = useMemo(() => {
    if (!currentUser) return [];
    const currentUserId = Number(currentUser.id);
    if (currentUser.type === "ADMIN") return optimisticBackups;
    if (currentUser.type === "COMPANY") {
      return optimisticBackups.filter(
        (b) => Number(b.company_id) === currentUserId && Number(b.uploaded_by) === currentUserId
      );
    }
    return optimisticBackups.filter(
      (b) => b.status === "APPROVED" || Number(b.renewed_by) === currentUserId
    );
  }, [optimisticBackups, currentUser]);
  const selectedBackup = visible.find((backup) => backup.id === selectedBackupId) || null;

  return (
    <section className="panel">
      <h3>Backups</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Renewed By</th>
              <th>Status</th>
              <th>Company ZIP</th>
              <th>Renewed ZIP</th>
              <th>Remarks</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan="9" className="muted">
                  No backups available for this role.
                </td>
              </tr>
            ) : (
              visible.map((backup) => (
                <tr key={backup.id}>
                  <td>{backup.id}</td>
                  <td>{backup.company_name || ""}</td>
                  <td>{backup.renewed_by_name || ""}</td>
                  <td>
                    <span className={`status-badge status-${backup.status.toLowerCase()}`}>{backup.status}</span>
                  </td>
                  <td className="path-cell">
                    <button
                      className="secondary btn-icon"
                      aria-label={`Download company zip for backup ${backup.id}`}
                      title="Download Company ZIP"
                      onClick={() =>
                        runAction(async () => {
                          const { blob, filename } = await fetchBackupFile(
                            `/api/backups/${backup.id}/download`,
                            session
                          );
                          triggerBrowserDownload(blob, filename);
                        }, "Original backup download started")
                      }
                    >
                      <DownloadIcon />
                    </button>
                  </td>
                  <td className="path-cell">
                    <button
                      className="secondary btn-icon"
                      aria-label={`Download renewed zip for backup ${backup.id}`}
                      title="Download Renewed ZIP"
                      disabled={!backup.renewed_file_path}
                      onClick={() =>
                        runAction(async () => {
                          const { blob, filename } = await fetchBackupFile(
                            `/api/backups/${backup.id}/renewed-download`,
                            session
                          );
                          triggerBrowserDownload(blob, filename);
                        }, "Renewed backup download started")
                      }
                    >
                      <DownloadIcon />
                    </button>
                  </td>
                  <td>{backup.remarks || "-"}</td>
                  <td>{new Date(backup.updated_at).toLocaleString()}</td>
                  <td className="table-actions">
                    <button
                      className="secondary btn-icon table-action-btn"
                      aria-label={`View backup ${backup.id}`}
                      title="View"
                      onClick={() => setSelectedBackupId(backup.id)}
                    >
                      <EyeIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedBackup ? (
        <div className="modal-overlay" onClick={() => setSelectedBackupId(null)}>
          <section className="modal-card modal-backup-detail" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header-with-action">
              <div>
                <h3>Backup Details #{selectedBackup.id}</h3>
              </div>
              <button className="secondary btn-icon" aria-label="Close modal" title="Close" onClick={() => setSelectedBackupId(null)}>
                <CloseIcon />
              </button>
            </div>
            <dl className="backup-detail-grid">
              <dt>Status</dt>
              <dd>{selectedBackup.status}</dd>
              <dt>Company</dt>
              <dd>{selectedBackup.company_name || `Company #${selectedBackup.company_id}`}</dd>
              <dt>Submitted by Employee</dt>
              <dd>{selectedBackup.renewed_by_name || "-"}</dd>
              <dt>Company ZIP</dt>
              <dd>
                <div className="row path-with-action">
                  <button
                    className="secondary btn-icon"
                    aria-label="Download company zip"
                    title="Download Company ZIP"
                    onClick={() =>
                      runAction(async () => {
                        const { blob, filename } = await fetchBackupFile(
                          `/api/backups/${selectedBackup.id}/download`,
                          session
                        );
                        triggerBrowserDownload(blob, filename);
                      }, "Original backup download started")
                    }
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </dd>
              <dt>Renewed ZIP</dt>
              <dd>
                <div className="row path-with-action">
                  <button
                    className="secondary btn-icon"
                    aria-label="Download renewed zip"
                    title="Download Renewed ZIP"
                    disabled={!selectedBackup.renewed_file_path}
                    onClick={() =>
                      runAction(async () => {
                        const { blob, filename } = await fetchBackupFile(
                          `/api/backups/${selectedBackup.id}/renewed-download`,
                          session
                        );
                        triggerBrowserDownload(blob, filename);
                      }, "Renewed backup download started")
                    }
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </dd>
            </dl>
          </section>
        </div>
      ) : null}
    </section>
  );
}
