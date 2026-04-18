import { useEffect, useRef, useState } from "react";
import { fetchBackupFile, triggerBrowserDownload, uploadZipWithAuth } from "../api";
import { useAppContext } from "../context";

export default function EmployeeBackupsPage() {
  const { session, backups, refreshBackups, runAction } = useAppContext();
  const [renewedFileById, setRenewedFileById] = useState({});
  const fileInputRefs = useRef({});

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
                <th>Company ID</th>
                <th>Status</th>
                <th>Original path</th>
                <th>Renewed ZIP</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="muted">
                    No approved backups available.
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{backup.id}</td>
                    <td>{backup.company_id}</td>
                    <td>{backup.status}</td>
                    <td className="path-cell">{backup.file_path}</td>
                    <td>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[backup.id] = el;
                        }}
                        type="file"
                        accept=".zip,application/zip"
                        onChange={(e) => setRenewedFile(backup.id, e.target.files?.[0])}
                      />
                    </td>
                    <td className="row">
                      <button
                        className="secondary"
                        onClick={() =>
                          runAction(async () => {
                            const { blob, filename } = await fetchBackupFile(
                              `/api/backups/${backup.id}/download`,
                              session
                            );
                            triggerBrowserDownload(blob, filename);
                          }, `Downloaded backup ${backup.id}`)
                        }
                      >
                        Download
                      </button>
                      <button
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
                        Notify
                      </button>
                    </td>
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
