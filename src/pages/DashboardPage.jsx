import { useAppContext } from "../context";
import { useEffect } from "react";

export default function DashboardPage() {
  const { currentUser, dashboardStats, refreshDashboardStats, runAction } = useAppContext();

  useEffect(() => {
    if (currentUser?.type === "ADMIN") {
      refreshDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (currentUser?.type !== "ADMIN") {
    return (
      <section className="panel">
        <h2>Dashboard</h2>
        <p className="muted">Use the sidebar tabs for your role-specific backup workflow.</p>
      </section>
    );
  }

  const monthly = dashboardStats?.monthlyApprovedBackups || [];
  const maxCount = Math.max(1, ...monthly.map((item) => item.count));

  return (
    <>
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
            <span className="muted">Pending backups</span>
            <strong>{dashboardStats?.pendingBackups || 0}</strong>
          </article>
          <article className="stat-card">
            <span className="muted">Approved backups</span>
            <strong>{dashboardStats?.approvedBackups || 0}</strong>
          </article>
          <article className="stat-card">
            <span className="muted">Total backups</span>
            <strong>{dashboardStats?.totalBackups || 0}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Monthly Approved Backups</h2>
        <p className="muted">Default graph for approved status backups only.</p>
        <div className="bar-chart">
          {monthly.length === 0 ? (
            <p className="muted">No approved backup data available yet.</p>
          ) : (
            monthly.map((item) => (
              <div key={item.month} className="bar-item">
                <div className="bar-label">{item.month}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                </div>
                <div className="bar-value">{item.count}</div>
              </div>
            ))
          )}
        </div>
        <button
          className="secondary"
          onClick={() => runAction(async () => refreshDashboardStats(), "Dashboard stats refreshed")}
        >
          Refresh Dashboard Stats
        </button>
      </section>
    </>
  );
}
