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

export default function CompanyBackupManagementPage() {
  const { session, backups, refreshBackups, runAction } = useAppContext();
  const fileInputRef = useRef(null);
  const paymentInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [selectedBackupId, setSelectedBackupId] = useState(null);
  const selectedBackup = backups.find((backup) => backup.id === selectedBackupId) || null;

  useEffect(() => {
    refreshBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <section className="panel">
        <h2>Company Backup Management</h2>
        <p className="muted">
          Upload a ZIP backup. The file is stored on the server under the project&apos;s{" "}
          <code>backups/company</code> folder and the full path is saved on the record.
        </p>
        <div className="upload-field-grid">
          <label htmlFor="company-backup-file">Backup File (ZIP)</label>
          <input
            id="company-backup-file"
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />

          <label htmlFor="company-payment-attachment">Attachment (Payment Screenshot)</label>
          <input
            id="company-payment-attachment"
            ref={paymentInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={(e) => setPaymentScreenshot(e.target.files?.[0] ?? null)}
          />

          <label htmlFor="company-upload-remarks">Remarks</label>
          <input
            id="company-upload-remarks"
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks for this upload"
          />
        </div>
        <div className="row">
          <button
            onClick={() =>
              runAction(async () => {
                if (!pendingFile) throw new Error("Please choose a ZIP file");
                const formData = new FormData();
                formData.append("file", pendingFile);
                if (paymentScreenshot) formData.append("paymentScreenshot", paymentScreenshot);
                formData.append("remarks", remarks.trim());
                await uploadZipWithAuth("/api/backups", session, formData);
                setPendingFile(null);
                setPaymentScreenshot(null);
                setRemarks("");
                if (fileInputRef.current) fileInputRef.current.value = "";
                if (paymentInputRef.current) paymentInputRef.current.value = "";
                await refreshBackups();
              }, "Backup uploaded and marked as PENDING")
            }
          >
            Upload Backup
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>My Backups</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Company</th>
                <th>Renewed By</th>
                <th>Status</th>
                <th>Original</th>
                <th>Renewed</th>
                <th>Admin Remarks</th>
                <th>Company Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="9" className="muted">
                    No backups uploaded yet.
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{backup.id}</td>
                    <td>{backup.company_name || ""}</td>
                    <td>{backup.renewed_by_name || ""}</td>
                    <td>{backup.status}</td>
                    <td className="path-cell">{backup.file_path}</td>
                    <td className="path-cell">{backup.renewed_file_path || "-"}</td>
                    <td>{backup.remarks || "-"}</td>
                    <td>{backup.company_remarks || "-"}</td>
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
              {selectedBackup.renewed_by ? (
                <>
                  <dt>Submitted by Employee</dt>
                  <dd>{selectedBackup.renewed_by_name || `Employee #${selectedBackup.renewed_by}`}</dd>
                </>
              ) : null}
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
                        const { blob, filename } = await fetchBackupFile(`/api/backups/${selectedBackup.id}/download`, session);
                        triggerBrowserDownload(blob, filename);
                      }, "Original backup download started")
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
                      }, "Renewed backup download started")
                    }
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </dd>
              <dt>Company Remarks</dt>
              <dd>{selectedBackup.company_remarks || "-"}</dd>
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
                      }, "Payment attachment download started")
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
