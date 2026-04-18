import { NavLink, Outlet } from "react-router-dom";
import { useAppContext } from "../context";

export default function Layout() {
  const { currentUser, logout, isPending, statusMessage } = useAppContext();
  const isAdmin = currentUser?.type === "ADMIN";
  const isEmployee = currentUser?.type === "EMPLOYEE";
  const isCompany = currentUser?.type === "COMPANY";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Renewal Portal</h2>
          <p className="muted">Management Panel</p>
        </div>

        <div className="nav-group">
          <p className="nav-title">Main</p>
          <nav className="nav">
            <NavLink to="/">Overview Dashboard</NavLink>
            {isAdmin ? <NavLink to="/user-management">User Management</NavLink> : null}
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
        <header className="topbar">
          <div>
            <h1>Backup Renewal Management</h1>
            <p className="muted">Welcome, {currentUser?.name || "User"}.</p>
          </div>
        </header>

        <section className="panel status-panel">
          <span className="chip">{currentUser ? `Role: ${currentUser.type}` : "No user selected"}</span>
          {isPending ? <span className="chip info">Processing...</span> : null}
          <span className="status-message">{statusMessage || "Ready"}</span>
        </section>

        <Outlet />
      </section>
    </main>
  );
}
