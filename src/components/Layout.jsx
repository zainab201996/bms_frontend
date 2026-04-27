import { NavLink, Outlet } from "react-router-dom";
import { useAppContext } from "../context";

export default function Layout() {
  const { currentUser, logout, appToast, dismissToast } = useAppContext();
  const isAdmin = currentUser?.type === "ADMIN";
  const isEmployee = currentUser?.type === "EMPLOYEE";
  const isCompany = currentUser?.type === "COMPANY";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Backup Renewal Management</h2>
          <p className="muted">{currentUser?.name || "User"}</p>
        </div>

        <div className="nav-group">
          <p className="nav-title">Main</p>
          <nav className="nav">
            <NavLink to="/">Overview Dashboard</NavLink>
            {isAdmin ? <NavLink to="/user-management">User Management</NavLink> : null}
            {isAdmin ? <NavLink to="/admin-companies">Companies</NavLink> : null}
            {isAdmin ? <NavLink to="/admin-backup-management">Backup Management</NavLink> : null}
            {isAdmin ? <NavLink to="/activity-logs">Activity Logs</NavLink> : null}
            {isEmployee ? <NavLink to="/employee-backups">Backups</NavLink> : null}
            {isCompany ? <NavLink to="/company-backup-management">Backup Management</NavLink> : null}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </aside>

      <section className="content">
        <Outlet />
      </section>
      {appToast ? (
        <div className={`snackbar snackbar--${appToast.variant}`} role="status" aria-live="polite">
          <span className="snackbar__msg">{appToast.message}</span>
          <button
            type="button"
            className="snackbar__close"
            onClick={dismissToast}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ) : null}
    </main>
  );
}
