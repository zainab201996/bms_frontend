import { useMemo, useOptimistic } from "react";
import { useAppContext } from "../context";

export default function BackupList() {
  const { backups, currentUser } = useAppContext();
  const [optimisticBackups] = useOptimistic(backups, (current) => current);

  const visible = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.type === "ADMIN") return optimisticBackups;
    if (currentUser.type === "COMPANY") {
      return optimisticBackups.filter((b) => b.company_id === currentUser.id);
    }
    return optimisticBackups.filter((b) => b.status === "APPROVED");
  }, [optimisticBackups, currentUser]);

  return (
    <section className="panel">
      <h3>Backups</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Company ID</th>
              <th>Status</th>
              <th>File</th>
              <th>Remarks</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan="6" className="muted">
                  No backups available for this role.
                </td>
              </tr>
            ) : (
              visible.map((backup) => (
                <tr key={backup.id}>
                  <td>{backup.id}</td>
                  <td>{backup.company_id}</td>
                  <td>
                    <span className={`status-badge status-${backup.status.toLowerCase()}`}>{backup.status}</span>
                  </td>
                  <td>{backup.file_path}</td>
                  <td>{backup.remarks || "-"}</td>
                  <td>{new Date(backup.updated_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
