import { useRef, useState } from "react";
import BackupList from "../components/BackupList";
import { uploadZipWithAuth } from "../api";
import { useAppContext } from "../context";

export default function CompanyPage() {
  const { currentUser, session, runAction, refreshBackups } = useAppContext();
  const fileInputRef = useRef(null);
  const paymentInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [remarks, setRemarks] = useState("");
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
          <input
            ref={paymentInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            disabled={disabled}
            onChange={(e) => setPaymentScreenshot(e.target.files?.[0] ?? null)}
          />
          <input
            type="text"
            value={remarks}
            disabled={disabled}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Upload remarks"
          />
          <button
            disabled={disabled}
            onClick={() =>
              runAction(
                async () => {
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
