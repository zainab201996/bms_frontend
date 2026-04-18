import { Navigate } from "react-router-dom";
import { useAppContext } from "../context";

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.type)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
