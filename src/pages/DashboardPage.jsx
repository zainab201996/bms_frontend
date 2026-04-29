import { useAppContext } from "../context";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api";

export default function DashboardPage() {
  const { currentUser, session, backups, dashboardStats, refreshDashboardStats, refreshBackups, runAction } = useAppContext();
  const [latestLogs, setLatestLogs] = useState([]);

  useEffect(() => {
    if (currentUser?.type === "ADMIN") {
      refreshDashboardStats();
      if (session) {
        fetchWithAuth("/api/logs?limit=4", session)
          .then((data) => setLatestLogs((data?.logs || []).slice(0, 4)))
          .catch(() => setLatestLogs([]));
      }
    } else if (currentUser) {
      refreshBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (currentUser?.type === "COMPANY") {
    const pendingBackups = backups.filter((backup) => backup.status === "PENDING").length;
    const approvedBackups = backups.filter((backup) => backup.status === "APPROVED").length;
    const submittedBackups = backups.filter((backup) => backup.status === "SUBMITTED").length;

    return (
      <>
        <section className="stats-rows" aria-label="Dashboard statistics">
          <div className="stats-row stats-row--three">
            <article className="stat-card">
              <span className="muted">Pending backups</span>
              <strong>{pendingBackups}</strong>
            </article>
            <article className="stat-card">
              <span className="muted">Approved backups</span>
              <strong>{approvedBackups}</strong>
            </article>
            <article className="stat-card">
              <span className="muted">Submitted backups</span>
              <strong>{submittedBackups}</strong>
            </article>
          </div>
        </section>
        <section className="panel">
          <h2>Company Dashboard</h2>
          <p className="muted">Counts are based only on your company backups.</p>
        </section>
      </>
    );
  }

  if (currentUser?.type === "EMPLOYEE") {
    const approvedBackups = backups.filter((backup) => backup.status === "APPROVED").length;
    const submittedBackups = backups.filter((backup) => backup.status === "SUBMITTED").length;

    return (
      <>
        <section className="stats-rows" aria-label="Dashboard statistics">
          <div className="stats-row stats-row--two">
            <article className="stat-card">
              <span className="muted">Approved backups</span>
              <strong>{approvedBackups}</strong>
            </article>
            <article className="stat-card">
              <span className="muted">Submitted backups</span>
              <strong>{submittedBackups}</strong>
            </article>
          </div>
        </section>
        <section className="panel">
          <h2>Employee Dashboard</h2>
          <p className="muted">Approved backups are available for renewal processing.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="panel">
        <h2>Admin Dashboard</h2>
      </section>
      <section className="stats-rows" aria-label="Dashboard statistics">
        <div className="stats-row stats-row--two">
          <article className="stat-card">
            <span className="muted">Employees</span>
            <strong>{dashboardStats?.employeeCount || 0}</strong>
          </article>
          <article className="stat-card">
            <span className="muted">Companies</span>
            <strong>{dashboardStats?.companyCount || 0}</strong>
          </article>
        </div>
        <div className="stats-row stats-row--three">
          <article className="stat-card">
            <span className="muted">Total companies</span>
            <strong>{dashboardStats?.companyCount || 0}</strong>
          </article>
          <article className="stat-card">
            <span className="muted">No submission for exactly 1 year</span>
            <strong>{dashboardStats?.companiesWithoutSubmissionForOneYear || 0}</strong>
          </article>
          <article className="stat-card">
            <span className="muted">Companies with renewed backup</span>
            <strong>{dashboardStats?.companiesWithRenewedBackup || 0}</strong>
          </article>
        </div>
        <div className="stats-row stats-row--four">
          <article className="stat-card">
            <span className="muted">Pending backups</span>
            <strong>{dashboardStats?.pendingBackups || 0}</strong>
          </article>
          <article className="stat-card">
            <span className="muted">Approved backups</span>
            <strong>{dashboardStats?.approvedBackups || 0}</strong>
          </article>
          <article className="stat-card">
            <span className="muted">Submitted backups</span>
            <strong>{dashboardStats?.submittedBackups || 0}</strong>
          </article>
          <article className="stat-card">
            <span className="muted">Total backups</span>
            <strong>{dashboardStats?.totalBackups || 0}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-with-action">
          <div>
            <h2 className="panel-page-title">Latest Activity</h2>
            <h3>Last 4 actions</h3>
          </div>
          <button
            className="secondary"
            onClick={() =>
              runAction(async () => {
                const data = await fetchWithAuth("/api/logs?limit=4", session);
                setLatestLogs((data?.logs || []).slice(0, 4));
              }, "Latest activity refreshed")
            }
          >
            Refresh
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Performed by</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {latestLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No recent activity.
                  </td>
                </tr>
              ) : (
                latestLogs.slice(0, 4).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <code className="log-action">{row.action || "—"}</code>
                    </td>
                    <td>{formatPerformedBy(row)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatTime(row.date)}</td>
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

function formatTime(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function formatPerformedBy(row) {
  const p = row.performedBy;
  if (!p || p.id == null) return "—";
  const label = p.name || p.username || `#${p.id}`;
  return `${label} (${p.type || "?"})`;
}
