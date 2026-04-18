import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { fetchWithAuth, loginRequest } from "./api";
import { clearSession, loadStoredSession, saveSession } from "./authStorage";

const AppContext = createContext(null);

const initialAuthState = (() => {
  const s = loadStoredSession();
  return { user: s?.user ?? null, token: s?.token ?? null };
})();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(initialAuthState.user);
  const [authToken, setAuthToken] = useState(initialAuthState.token);
  const [backups, setBackups] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [managedUsers, setManagedUsers] = useState([]);
  const [latestCredentials, setLatestCredentials] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const session = useMemo(() => {
    if (!currentUser || !authToken) return null;
    return { user: currentUser, token: authToken };
  }, [currentUser, authToken]);

  async function refreshBackups() {
    if (!session) return;
    const data = await fetchWithAuth("/api/backups", session);
    setBackups(data.backups || []);
  }

  async function refreshDashboardStats() {
    if (!session || currentUser.type !== "ADMIN") return;
    const data = await fetchWithAuth("/api/dashboard-stats", session);
    setDashboardStats(data);
  }

  async function refreshManagedUsers() {
    if (!session) return;
    const data = await fetchWithAuth("/api/users", session);
    setManagedUsers(data.users || []);
  }

  async function login(username, password) {
    const { user, token } = await loginRequest({ username, password });
    setCurrentUser(user);
    setAuthToken(token);
    saveSession(user, token);
    setStatusMessage(`Logged in as ${user.type}`);
    return user;
  }

  function logout() {
    setCurrentUser(null);
    setAuthToken(null);
    clearSession();
    setBackups([]);
    setDashboardStats(null);
    setManagedUsers([]);
    setLatestCredentials([]);
    setStatusMessage("Logged out");
  }

  function runAction(action, successText) {
    startTransition(async () => {
      try {
        await action();
        setStatusMessage(successText);
      } catch (error) {
        setStatusMessage(error.message);
      }
    });
  }

  const value = {
    currentUser,
    authToken,
    session,
    login,
    logout,
    backups,
    dashboardStats,
    managedUsers,
    latestCredentials,
    setLatestCredentials,
    refreshBackups,
    refreshDashboardStats,
    refreshManagedUsers,
    runAction,
    statusMessage,
    isPending
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
