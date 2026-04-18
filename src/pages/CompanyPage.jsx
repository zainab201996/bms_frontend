import { useRef, useState } from "react";
import BackupList from "../components/BackupList";
import { uploadZipWithAuth } from "../api";
import { useAppContext } from "../context";

export default function CompanyPage() {
  const { currentUser, session, runAction, refreshBackups } = useAppContext();
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const disabled = currentUser?.type !== "COMPANY";

  return (
    <>
      <section className="panel">
        <h2>Company Page</h2>
        <p className="muted">Upload a ZIP backup. Files are stored on the server in the repo&apos;s backups folder.</p>
        <div className="row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            disabled={disabled}
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />
          <button
            disabled={disabled}
            onClick={() =>
              runAction(
                async () => {
                  if (!pendingFile) throw new Error("Please choose a ZIP file");
                  const formData = new FormData();
                  formData.append("file", pendingFile);
                  await uploadZipWithAuth("/api/backups", session, formData);
                  setPendingFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  await refreshBackups();
                },
                "Backup uploaded as PENDING"
              )
            }
          >
            Upload Backup
          </button>
        </div>
      </section>
      <BackupList />
    </>
  );
}
