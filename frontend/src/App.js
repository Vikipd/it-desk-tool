// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK. THE PERMISSIONS ARE FIXED.

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TicketForm from "./pages/TicketForm";
import TicketDetail from "./pages/TicketDetail";
import FilteredTicketsPage from "./pages/FilteredTicketsPage";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import UserManagementPage from "./pages/UserManagementPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ForgotPassword from "./pages/ForgotPassword";

const queryClient = new QueryClient();

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/admin-dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OBSERVER"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OBSERVER"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute allowedRoles={["CLIENT", "OBSERVER", "ADMIN"]}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["TECHNICIAN", "OBSERVER", "ADMIN"]}
              >
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />

          {/* --- MODIFICATION: TECHNICIAN ROLE ADDED TO TICKET FORM ACCESS --- */}
          <Route
            path="/ticket-form"
            element={
              <ProtectedRoute allowedRoles={["CLIENT", "ADMIN", "TECHNICIAN"]}>
                <TicketForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute
                allowedRoles={["ADMIN", "OBSERVER", "CLIENT", "TECHNICIAN"]}
              >
                <TicketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/filtered-tickets"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OBSERVER"]}>
                <FilteredTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
