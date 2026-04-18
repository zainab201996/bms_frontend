import { useEffect, useRef, useState } from "react";
import { uploadZipWithAuth } from "../api";
import { useAppContext } from "../context";

export default function CompanyBackupManagementPage() {
  const { session, backups, refreshBackups, runAction } = useAppContext();
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);

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
        <div className="row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() =>
              runAction(async () => {
                if (!pendingFile) throw new Error("Please choose a ZIP file");
                const formData = new FormData();
                formData.append("file", pendingFile);
                await uploadZipWithAuth("/api/backups", session, formData);
                setPendingFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
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
                <th>Status</th>
                <th>Original</th>
                <th>Renewed</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="5" className="muted">
                    No backups uploaded yet.
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{backup.id}</td>
                    <td>{backup.status}</td>
                    <td className="path-cell">{backup.file_path}</td>
                    <td className="path-cell">{backup.renewed_file_path || "-"}</td>
                    <td>{backup.remarks || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
