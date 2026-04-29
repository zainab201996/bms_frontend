import { useEffect, useState } from "react";
import { fetchBackupFile, fetchWithAuth, triggerBrowserDownload } from "../api";
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

function StatusBadge({ status }) {
  const cls = `status-badge status-${String(status || "").toLowerCase()}`;
  return <span className={cls}>{status || "-"}</span>;
}

export default function AdminBackupManagementPage() {
  const { session, backups, refreshBackups, runAction } = useAppContext();
  const [remarksById, setRemarksById] = useState({});
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState("");

  useEffect(() => {
    refreshBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPaymentPreviewUrl("");
    if (!selectedBackup?.payment_screenshot_path) return undefined;
    let cancelled = false;
    let objectUrl = "";
    fetchBackupFile(`/api/backups/${selectedBackup.id}/payment-attachment-download`, session, {
      defaultFilename: "payment-attachment.png"
    })
      .then(({ blob }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPaymentPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setPaymentPreviewUrl("");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedBackup, session]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredBackups = backups.filter((backup) => {
    const statusMatch = statusFilter === "ALL" || backup.status === statusFilter;
    if (!statusMatch) return false;
    if (!normalizedSearch) return true;
    const companyName = (backup.company_name || "").toLowerCase();
    return String(backup.id).includes(normalizedSearch) || companyName.includes(normalizedSearch);
  });
  const pendingBackups = filteredBackups.filter((backup) => backup.status === "PENDING");

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
        <div className="row">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by backup id or company"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUBMITTED">SUBMITTED</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <h3>Pending Backups</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Company</th>
                <th>Status</th>
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
                    <td>{backup.company_name || ""}</td>
                    <td><StatusBadge status={backup.status} /></td>
                    <td>
                      <input
                        value={remarksById[backup.id] || ""}
                        onChange={(e) => setRemarksById((prev) => ({ ...prev, [backup.id]: e.target.value }))}
                        placeholder="Required remarks"
                      />
                    </td>
                    <td className="row table-actions">
                      <button className="secondary btn-icon table-action-btn" onClick={() => setSelectedBackup(backup)} title="View">
                        <EyeIcon />
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
                <th>Company</th>
                <th>Renewed By</th>
                <th>Status</th>
                <th>Company Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBackups.map((backup) => (
                <tr key={backup.id}>
                  <td>{backup.id}</td>
                  <td>{backup.company_name || ""}</td>
                  <td>{backup.renewed_by_name || ""}</td>
                  <td><StatusBadge status={backup.status} /></td>
                  <td>{backup.company_remarks || "-"}</td>
                  <td className="table-actions">
                    <button className="secondary btn-icon table-action-btn" onClick={() => setSelectedBackup(backup)} title="View">
                      <EyeIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedBackup ? (
        <div className="modal-overlay" onClick={() => setSelectedBackup(null)}>
          <div className="modal-card modal-backup-detail" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header-with-action">
              <h3>Backup #{selectedBackup.id}</h3>
              <button className="secondary btn-icon" onClick={() => setSelectedBackup(null)} title="Close" aria-label="Close modal">
                <CloseIcon />
              </button>
            </div>
            <dl className="backup-detail-grid">
              <dt>Company</dt>
              <dd>{selectedBackup.company_name || `Company #${selectedBackup.company_id}`}</dd>
              {selectedBackup.renewed_by ? (
                <>
                  <dt>Submitted by Employee</dt>
                  <dd>{selectedBackup.renewed_by_name || `Employee #${selectedBackup.renewed_by}`}</dd>
                </>
              ) : null}
              <dt>Status</dt>
              <dd><StatusBadge status={selectedBackup.status} /></dd>
              <dt>Remarks</dt>
              <dd>{selectedBackup.remarks || "—"}</dd>
              <dt>Original file</dt>
              <dd>
                <div className="row path-with-action">
                  <span className="path-block">Original file available for secure download.</span>
                  <button className="secondary btn-icon" onClick={() => downloadOriginal(selectedBackup)} title="Download Company ZIP">
                    <DownloadIcon />
                  </button>
                </div>
              </dd>
              <dt>Renewed file</dt>
              <dd>
                <div className="row path-with-action">
                  <span className="path-block">
                    {selectedBackup.renewed_file_path ? "Renewed file available for secure download." : "—"}
                  </span>
                  <button
                    className="secondary btn-icon"
                    disabled={!selectedBackup.renewed_file_path}
                    onClick={() => downloadRenewed(selectedBackup)}
                    title="Download Renewed ZIP"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </dd>
              <dt>Company remarks</dt>
              <dd>{selectedBackup.company_remarks || "—"}</dd>
              <dt>Payment screenshot</dt>
              <dd>
                <div className="payment-preview-wrap">
                  {paymentPreviewUrl ? (
                    <img src={paymentPreviewUrl} alt={`Payment proof for backup ${selectedBackup.id}`} className="payment-preview-image" />
                  ) : (
                    <span className="path-block">
                      {selectedBackup.payment_screenshot_path ? "Loading screenshot preview..." : "—"}
                    </span>
                  )}
                  <button
                    className="secondary btn-icon"
                    disabled={!selectedBackup.payment_screenshot_path}
                    onClick={() =>
                      runAction(async () => {
                        const { blob, filename } = await fetchBackupFile(
                          `/api/backups/${selectedBackup.id}/payment-attachment-download`,
                          session,
                          { defaultFilename: "payment-attachment.png" }
                        );
                        triggerBrowserDownload(blob, filename);
                      }, `Downloaded payment attachment for backup ${selectedBackup.id}`)
                    }
                    title="Download Payment Attachment"
                    aria-label="Download payment attachment"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </dd>
            </dl>
          </div>
        </div>
      ) : null}
    </>
  );
}
