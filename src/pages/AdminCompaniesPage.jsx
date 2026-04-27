import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api";
import { useAppContext } from "../context";

const COMPANY_STAGES = ["ONBOARDING", "ACTIVE", "PAYMENT_PENDING", "SUSPENDED"];

export default function AdminCompaniesPage() {
  const { session, runAction } = useAppContext();
  const [companies, setCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [softwareTypesInput, setSoftwareTypesInput] = useState("");
  const [companyStage, setCompanyStage] = useState("ONBOARDING");

  async function loadCompanies() {
    const data = await fetchWithAuth("/api/users/companies", session);
    setCompanies(data.companies || []);
  }

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEditModal(company) {
    setEditingCompany(company);
    setSoftwareTypesInput((company.software_types || []).join(", "));
    setCompanyStage(company.company_stage || "ONBOARDING");
  }

  function closeEditModal() {
    setEditingCompany(null);
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header-with-action">
          <div>
            <h2 className="panel-page-title">Companies</h2>
            <h3>Software types and current stage</h3>
          </div>
          <button className="secondary" type="button" onClick={() => runAction(loadCompanies, "Companies refreshed")}>
            Refresh
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Software Types</th>
                <th>Stage</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="muted">
                    No companies found.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.id}</td>
                    <td>{company.name}</td>
                    <td>{company.email}</td>
                    <td>{company.software_types?.join(", ") || "-"}</td>
                    <td>
                      <span className={`status-badge company-stage-badge company-stage-${(company.company_stage || "ONBOARDING").toLowerCase()}`}>
                        {company.company_stage || "ONBOARDING"}
                      </span>
                    </td>
                    <td>{company.location || "-"}</td>
                    <td className="table-actions">
                      <button type="button" className="secondary table-action-btn" onClick={() => openEditModal(company)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingCompany ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeEditModal}>
          <div className="modal-card user-edit-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Edit company #{editingCompany.id}</h3>
            <div className="form-grid">
              <label htmlFor="companySoftwareTypes">Software types (comma separated)</label>
              <input
                id="companySoftwareTypes"
                value={softwareTypesInput}
                onChange={(event) => setSoftwareTypesInput(event.target.value)}
                placeholder="Peachtree, QuickBooks"
              />

              <label htmlFor="companyStage">Company stage</label>
              <select id="companyStage" value={companyStage} onChange={(event) => setCompanyStage(event.target.value)}>
                {COMPANY_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>

              <div className="row modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    runAction(async () => {
                      await fetchWithAuth(`/api/users/${editingCompany.id}`, session, {
                        method: "PATCH",
                        body: JSON.stringify({
                          software_types: softwareTypesInput,
                          company_stage: companyStage
                        })
                      });
                      closeEditModal();
                      await loadCompanies();
                    }, "Company updated")
                  }
                >
                  Save
                </button>
                <button type="button" className="secondary" onClick={closeEditModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
