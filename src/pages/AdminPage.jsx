import { useState } from "react";
import BackupList from "../components/BackupList";
import { fetchWithAuth } from "../api";
import { useAppContext } from "../context";

export default function AdminPage() {
  const { currentUser, session, backups, runAction } = useAppContext();
  const [remarks, setRemarks] = useState("Reviewed by admin");
  const disabled = currentUser?.type !== "ADMIN";

  const review = (status) => {
    runAction(
      async () => {
        const pending = backups.find((backup) => backup.status === "PENDING");
        if (!pending) throw new Error("No PENDING backup available");
        await fetchWithAuth(
          `/api/backups/${pending.id}/review`,
          session,
          {
            method: "PATCH",
            body: JSON.stringify({ status, remarks })
          }
        );
      },
      `Backup ${status}`
    );
  };

  return (
    <>
      <section className="panel">
        <h2>Admin Page</h2>
        <p className="muted">Review pending backups with required remarks.</p>
        <div className="row">
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={disabled} />
          <button disabled={disabled} onClick={() => review("APPROVED")}>
            Approve Pending
          </button>
          <button className="danger" disabled={disabled} onClick={() => review("REJECTED")}>
            Reject Pending
          </button>
        </div>
      </section>
      <BackupList />
    </>
  );
}
