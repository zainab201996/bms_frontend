import { useEffect, useRef, useState } from "react";
import BackupList from "../components/BackupList";
import { uploadZipWithAuth } from "../api";
import { useAppContext } from "../context";

export default function EmployeePage() {
  const { currentUser, session, backups, runAction, refreshBackups } = useAppContext();
  const fileInputRef = useRef(null);
  const [renewedFile, setRenewedFile] = useState(null);
  const [selectedBackupId, setSelectedBackupId] = useState("");
  const disabled = currentUser?.type !== "EMPLOYEE";
  const approvedBackups = backups.filter((backup) => backup.status === "APPROVED");

  useEffect(() => {
    if (currentUser?.type === "EMPLOYEE") {
      refreshBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <section className="panel">
        <h2>Employee Page</h2>
        <p className="muted">Submit renewal only for APPROVED backups. Upload a ZIP stored on the server.</p>
        <div className="row">
          <select
            disabled={disabled || approvedBackups.length === 0}
            value={selectedBackupId}
            onChange={(e) => setSelectedBackupId(e.target.value)}
          >
            <option value="">Select APPROVED backup</option>
            {approvedBackups.map((backup) => (
              <option key={backup.id} value={backup.id}>
                Backup #{backup.id} - Company {backup.company_id}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            disabled={disabled}
            onChange={(e) => setRenewedFile(e.target.files?.[0] ?? null)}
          />
          <button
            disabled={disabled || !selectedBackupId || approvedBackups.length === 0}
            onClick={() =>
              runAction(
                async () => {
                  const approved = approvedBackups.find((backup) => String(backup.id) === String(selectedBackupId));
                  if (!approved) throw new Error("Please select an APPROVED backup");
                  if (!renewedFile) throw new Error("Please choose a renewed ZIP file");
                  const formData = new FormData();
                  formData.append("file", renewedFile);
                  await uploadZipWithAuth(`/api/backups/${approved.id}/renewal`, session, formData);
                  setRenewedFile(null);
                  setSelectedBackupId("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  await refreshBackups();
                },
                "Renewed backup submitted and notification triggered"
              )
            }
          >
            Submit Renewal
          </button>
        </div>
      </section>
      <BackupList />
    </>
  );
}
