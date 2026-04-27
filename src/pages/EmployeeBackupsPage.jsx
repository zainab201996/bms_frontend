import { useEffect, useRef, useState } from "react";
import { fetchBackupFile, triggerBrowserDownload, uploadZipWithAuth } from "../api";
import { useAppContext } from "../context";

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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M15 18H5.5a1 1 0 0 1-.8-1.6l1.3-1.8V10a6 6 0 1 1 12 0v4.6l1.3 1.8a1 1 0 0 1-.8 1.6H18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" />
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

export default function EmployeeBackupsPage() {
  const { session, currentUser, backups, refreshBackups, runAction } = useAppContext();
  const [renewedFileById, setRenewedFileById] = useState({});
  const [selectedBackupId, setSelectedBackupId] = useState(null);
  const fileInputRefs = useRef({});
  const currentUserId = Number(currentUser?.id);
  const visibleBackups = backups.filter(
    (backup) => backup.status === "APPROVED" || Number(backup.renewed_by) === currentUserId
  );
  const selectedBackup = visibleBackups.find((backup) => backup.id === selectedBackupId) || null;

  useEffect(() => {
    refreshBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRenewedFile = (backupId, file) => {
    setRenewedFileById((prev) => {
      const next = { ...prev };
      if (file) next[backupId] = file;
      else delete next[backupId];
      return next;
    });
  };

  return (
    <>
      <section className="panel">
        <h2>Employee Backups</h2>
        <p className="muted">
          Download approved originals from the server, upload a renewed ZIP (stored under <code>backups/renewed</code>
          ), then notify the company.
        </p>
      </section>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Company</th>
                <th>Renewed By</th>
                <th>Status</th>
                <th>Original path</th>
                <th>Renewed path</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleBackups.length === 0 ? (
                <tr>
                  <td colSpan="7" className="muted">
                    No approved or self-renewed backups available.
                  </td>
                </tr>
              ) : (
                visibleBackups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{backup.id}</td>
                    <td>{backup.company_name || ""}</td>
                    <td>{backup.renewed_by_name || ""}</td>
                    <td>{backup.status}</td>
                    <td className="path-cell">{backup.file_path}</td>
                    <td className="path-cell">
                      {backup.status === "SUBMITTED" ? (
                        <span className="path-cell-inline">{backup.renewed_file_path || "-"}</span>
                      ) : (
                        <input
                          className="path-cell-input"
                          ref={(el) => {
                            fileInputRefs.current[backup.id] = el;
                          }}
                          type="file"
                          accept=".zip,application/zip"
                          disabled={backup.status !== "APPROVED"}
                          onChange={(e) => setRenewedFile(backup.id, e.target.files?.[0])}
                        />
                      )}
                    </td>
                    <td className="row table-actions">
                      <button
                        className="btn-icon table-action-btn"
                        disabled={backup.status !== "APPROVED"}
                        aria-label={`Notify company for backup ${backup.id}`}
                        title="Notify"
                        onClick={() =>
                          runAction(async () => {
                            const file = renewedFileById[backup.id];
                            if (!file) throw new Error("Please choose a renewed ZIP file");
                            const formData = new FormData();
                            formData.append("file", file);
                            await uploadZipWithAuth(`/api/backups/${backup.id}/renewal`, session, formData);
                            setRenewedFile(backup.id, undefined);
                            const input = fileInputRefs.current[backup.id];
                            if (input) input.value = "";
                            await refreshBackups();
                          }, `Backup ${backup.id} renewed and company notified`)
                        }
                      >
                        <BellIcon />
                      </button>
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
      </section>
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
              <dt>Company ZIP path</dt>
              <dd>
                <div className="row path-with-action">
                  <span className="path-block">{selectedBackup.file_path}</span>
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
                      }, `Downloaded backup ${selectedBackup.id}`)
                    }
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </dd>
              <dt>Renewed ZIP path</dt>
              <dd>
                <div className="row path-with-action">
                  <span className="path-block">{selectedBackup.renewed_file_path || "-"}</span>
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
                      }, `Downloaded renewed backup ${selectedBackup.id}`)
                    }
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </dd>
              <dt>Payment Screenshot Path</dt>
              <dd>
                <div className="row path-with-action">
                  <span className="path-block">{selectedBackup.payment_screenshot_path || "-"}</span>
                  <button
                    className="secondary btn-icon"
                    aria-label="Download payment attachment"
                    title="Download Payment Attachment"
                    disabled={!selectedBackup.payment_screenshot_path}
                    onClick={() =>
                      runAction(async () => {
                        const { blob, filename } = await fetchBackupFile(
                          `/api/backups/${selectedBackup.id}/payment-attachment-download`,
                          session,
                          {
                            defaultFilename: "payment-attachment.png",
                            fallbackPath: selectedBackup.payment_screenshot_path
                          }
                        );
                        triggerBrowserDownload(blob, filename);
                      }, `Downloaded payment attachment for backup ${selectedBackup.id}`)
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
    </>
  );
}
