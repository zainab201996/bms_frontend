import { useRef, useState } from "react";
import BackupList from "../components/BackupList";
import { uploadZipWithAuth } from "../api";
import { useAppContext } from "../context";

export default function EmployeePage() {
  const { currentUser, session, backups, runAction, refreshBackups } = useAppContext();
  const fileInputRef = useRef(null);
  const [renewedFile, setRenewedFile] = useState(null);
  const disabled = currentUser?.type !== "EMPLOYEE";

  return (
    <>
      <section className="panel">
        <h2>Employee Page</h2>
        <p className="muted">Submit renewal only for APPROVED backups. Upload a ZIP stored on the server.</p>
        <div className="row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            disabled={disabled}
            onChange={(e) => setRenewedFile(e.target.files?.[0] ?? null)}
          />
          <button
            disabled={disabled}
            onClick={() =>
              runAction(
                async () => {
                  const approved = backups.find((backup) => backup.status === "APPROVED");
                  if (!approved) throw new Error("No APPROVED backup available");
                  if (!renewedFile) throw new Error("Please choose a renewed ZIP file");
                  const formData = new FormData();
                  formData.append("file", renewedFile);
                  await uploadZipWithAuth(`/api/backups/${approved.id}/renewal`, session, formData);
                  setRenewedFile(null);
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
