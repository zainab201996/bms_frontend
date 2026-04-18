import { useState, useCallback, useEffect } from "react";
import { fetchWithAuth } from "../api";
import { useAppContext } from "../context";
import CredentialsToast from "../components/CredentialsToast";

export default function UserManagementPage() {
  const {
    currentUser,
    session,
    managedUsers,
    latestCredentials,
    refreshManagedUsers,
    runAction,
    setLatestCredentials
  } = useAppContext();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createUserType, setCreateUserType] = useState("EMPLOYEE");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [companyCsvFile, setCompanyCsvFile] = useState(null);
  const [csvInputKey, setCsvInputKey] = useState(0);
  const [credentialsToast, setCredentialsToast] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);
  const [snackbar, setSnackbar] = useState(null);

  const dismissCredentialsToast = useCallback(() => {
    setCredentialsToast(null);
  }, []);

  useEffect(() => {
    refreshManagedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!snackbar) return;
    const t = setTimeout(() => setSnackbar(null), 5000);
    return () => clearTimeout(t);
  }, [snackbar]);

  function openCreateModal() {
    setCreateUserType("EMPLOYEE");
    setEmployeeName("");
    setEmployeeEmail("");
    setCompanyCsvFile(null);
    setCsvInputKey((k) => k + 1);
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
  }

  function createEmployeeInModal() {
    runAction(async () => {
      const response = await fetchWithAuth("/api/users/employees", session, {
        method: "POST",
        body: JSON.stringify({
          name: employeeName,
          email: employeeEmail
        })
      });
      setLatestCredentials([response.user]);
      setCredentialsToast({
        title: "Employee user created",
        users: [response.user]
      });
      setEmployeeName("");
      setEmployeeEmail("");
      await refreshManagedUsers();
      closeCreateModal();
    }, "Employee user created");
  }

  function createCompaniesFromCsvInModal() {
    runAction(async () => {
      if (!companyCsvFile) {
        throw new Error("Please choose a CSV file");
      }
      const csvContent = await companyCsvFile.text();
      const response = await fetchWithAuth("/api/users/companies-csv", session, {
        method: "POST",
        body: JSON.stringify({ csvContent })
      });
      const created = response.created || [];
      setLatestCredentials(created);
      setCredentialsToast({
        title:
          created.length === 1
            ? "Company user created"
            : `${created.length} company users created`,
        users: created
      });
      setCompanyCsvFile(null);
      setCsvInputKey((k) => k + 1);
      await refreshManagedUsers();
      closeCreateModal();
    }, "Company users created from CSV");
  }

  function openEdit(user) {
    setEditUser(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditLocation(user.location || "");
  }

  function closeEdit() {
    setEditUser(null);
  }

  return (
    <>
      <CredentialsToast
        open={Boolean(credentialsToast)}
        title={credentialsToast?.title || ""}
        users={credentialsToast?.users || []}
        onClose={dismissCredentialsToast}
      />

      {snackbar ? (
        <div
          className={`snackbar snackbar--${snackbar.variant}`}
          role="status"
          aria-live="polite"
        >
          <span className="snackbar__msg">{snackbar.message}</span>
          <button
            type="button"
            className="snackbar__close"
            onClick={() => setSnackbar(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ) : null}

      <section className="panel">
        <div className="panel-header-with-action">
          <div>
            <h2 className="panel-page-title">User Management</h2>
            <h3>All Users</h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={openCreateModal}
            aria-label="Add user"
            title="Add user"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Username</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="muted">
                    No users yet.
                  </td>
                </tr>
              ) : (
                managedUsers.map((user) => {
                  const isSelf =
                    currentUser != null && String(user.id) === String(currentUser.id);
                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.type}</td>
                      <td>{user.username}</td>
                      <td>{user.location || "-"}</td>
                      <td className="table-actions">
                        <button type="button" className="secondary table-action-btn" onClick={() => openEdit(user)}>
                          Edit
                        </button>
                        {isSelf ? null : (
                          <button
                            type="button"
                            className="danger table-action-btn"
                            title="Delete user"
                            onClick={() => setDeleteTarget(user)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3>Generated Credentials</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Username</th>
                <th>Temporary Password</th>
              </tr>
            </thead>
            <tbody>
              {latestCredentials.length === 0 ? (
                <tr>
                  <td colSpan="5" className="muted">
                    No newly generated credentials yet.
                  </td>
                </tr>
              ) : (
                latestCredentials.map((user) => (
                  <tr key={`${user.id}-${user.username}`}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.type}</td>
                    <td>{user.username}</td>
                    <td>{user.password}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {createModalOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-modal-title"
          onClick={closeCreateModal}
        >
          <div className="modal-card user-create-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="create-user-modal-title">Create user</h3>
            <p className="muted">Choose who you are adding, then complete the fields below.</p>
            <div className="form-grid">
              <label htmlFor="createUserType">User type</label>
              <select
                id="createUserType"
                value={createUserType}
                onChange={(e) => setCreateUserType(e.target.value)}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="COMPANY">Company</option>
              </select>

              {createUserType === "EMPLOYEE" ? (
                <>
                  <label htmlFor="employeeName">Employee name</label>
                  <input
                    id="employeeName"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="John Employee"
                    autoComplete="off"
                  />
                  <label htmlFor="employeeEmail">Employee email</label>
                  <input
                    id="employeeEmail"
                    type="email"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    placeholder="john.employee@company.com"
                    autoComplete="off"
                  />
                </>
              ) : (
                <>
                  <p className="small span-full">
                    CSV headers: <code>company_name,email,address</code>
                  </p>
                  <label htmlFor="companyCsv">CSV file</label>
                  <input
                    key={csvInputKey}
                    id="companyCsv"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setCompanyCsvFile(e.target.files?.[0] || null)}
                  />
                </>
              )}
              <div className="row modal-actions span-full">
                {createUserType === "EMPLOYEE" ? (
                  <button type="button" onClick={createEmployeeInModal}>
                    Create employee
                  </button>
                ) : (
                  <button type="button" onClick={createCompaniesFromCsvInModal}>
                    Upload CSV and create companies
                  </button>
                )}
                <button type="button" className="secondary" onClick={closeCreateModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editUser ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeEdit}>
          <div className="modal-card user-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit user #{editUser.id}</h3>
            <p className="muted">
              Username ({editUser.username}) is system-generated and cannot be changed here.
            </p>
            <div className="form-grid">
              <label htmlFor="editName">Name</label>
              <input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <label htmlFor="editEmail">Email</label>
              <input
                id="editEmail"
                type="email"
                autoComplete="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              {editUser.type === "COMPANY" ? (
                <>
                  <label htmlFor="editLocation">Address</label>
                  <input
                    id="editLocation"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Company address"
                  />
                </>
              ) : null}
              <div className="row modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    runAction(async () => {
                      const body = {
                        name: editName.trim(),
                        email: editEmail.trim()
                      };
                      if (editUser.type === "COMPANY") {
                        body.location = editLocation.trim();
                      }
                      await fetchWithAuth(`/api/users/${editUser.id}`, session, {
                        method: "PATCH",
                        body: JSON.stringify(body)
                      });
                      closeEdit();
                      await refreshManagedUsers();
                    }, "User updated")
                  }
                >
                  Save
                </button>
                <button type="button" className="secondary" onClick={closeEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete user?</h3>
            <p>
              This will permanently remove <strong>{deleteTarget.name}</strong> ({deleteTarget.email}
              ). Related data may be removed per database rules.
            </p>
            <div className="row modal-actions">
              <button
                type="button"
                className="danger"
                disabled={deletePending}
                onClick={async () => {
                  setDeletePending(true);
                  try {
                    await fetchWithAuth(`/api/users/${deleteTarget.id}`, session, {
                      method: "DELETE"
                    });
                    setDeleteTarget(null);
                    await refreshManagedUsers();
                    setSnackbar({ variant: "success", message: "User deleted successfully." });
                  } catch (err) {
                    setSnackbar({
                      variant: "error",
                      message: err.message || "Failed to delete user."
                    });
                  } finally {
                    setDeletePending(false);
                  }
                }}
              >
                {deletePending ? "Deleting…" : "Delete"}
              </button>
              <button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
