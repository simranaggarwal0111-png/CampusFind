import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lost from "./pages/Lost";
import Found from "./pages/Found";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import AdminDashboard from "./pages/AdminDashboard";
import {
  AdminClaims,
  AdminInventory,
  AdminAudit,
  AdminUsers,
  AdminGuide,
} from "./pages/admin";
import UserDashboard from "./pages/UserDashboard";
import HandoverFlow from "./pages/HandoverFlow";
import ItemDetails from "./pages/ItemDetails";
import QRRecovery from "./pages/QRRecovery";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const user = getUser();
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  const role = user.role?.toLowerCase()?.trim();
  if (role !== "admin") {
    return <Navigate to="/my-activity" replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/recover/:token" element={<QRRecovery />} />
        <Route path="/lost" element={<ProtectedRoute><Lost /></ProtectedRoute>} />
        <Route path="/found" element={<ProtectedRoute><Found /></ProtectedRoute>} />
        <Route path="/items/:id" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />
        <Route path="/handover" element={<ProtectedRoute><HandoverFlow /></ProtectedRoute>} />

        {/* Student / Authenticated Pages */}
        <Route path="/report-lost" element={<ProtectedRoute><ReportLost /></ProtectedRoute>} />
        <Route path="/report-found" element={<ProtectedRoute><ReportFound /></ProtectedRoute>} />
        <Route path="/my-activity" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

        {/* Admin Protected Pages & Sub-routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/claims" element={<AdminRoute><AdminClaims /></AdminRoute>} />
        <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/guide" element={<AdminRoute><AdminGuide /></AdminRoute>} />
        <Route path="/admin/:tab" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
