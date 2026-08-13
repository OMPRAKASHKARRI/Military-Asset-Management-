import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";

const TITLES = {
  "/dashboard": "Dashboard",
  "/purchases": "Purchases",
  "/transfers": "Transfers",
  "/assignments": "Assignments",
  "/expenditures": "Expenditures",
  "/audit-logs": "Audit Logs",
  "/users": "User Management",
};

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
}

function Layout() {
  const location = useLocation();
  const title = TITLES[location.pathname] || "MilAsset";

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} />
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
