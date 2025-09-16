import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

// --- MODIFICATION START: Corrected Import Paths ---
import { AuthProvider } from "./AuthContext"; // Correct path for the provider
import { useAuth } from "./hooks/useAuth";     // Correct path for the hook
// --- MODIFICATION END ---

// Import all your pages
import Login from "./pages/Login";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TicketForm from "./pages/TicketForm";
import TicketDetail from "./pages/TicketDetail";
import FilteredTicketsPage from "./pages/FilteredTicketsPage"; // Assuming this is the correct name
import TechnicianDashboard from "./pages/TechnicianDashboard";
import UserManagementPage from "./pages/UserManagementPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

const queryClient = new QueryClient();

// This ProtectedRoute component is correct and uses the hook properly.
const ProtectedRoute = ({ allowedRoles, children }) => {
    // The useAuth hook will get its data from the AuthProvider context.
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Note: The property from your context is 'userRole', but your hook likely renames it to 'role'.
    // If you get an error here, it means we need to use 'userRole' instead of 'role'.
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/admin-dashboard" replace />; // Redirect to a safe default page
    }
    
    return children;
};

// This wrapper is essential for making the AuthContext available to all components.
function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Toaster position="top-center" reverseOrder={false} />
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    
                    {/* The new route for forcing a password change */}
                    <Route 
                        path="/change-password" 
                        element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} 
                    />

                    {/* Dashboard Routes */}
                    <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'OBSERVER']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/client-dashboard" element={<ProtectedRoute allowedRoles={['CLIENT', 'OBSERVER', 'ADMIN']}><ClientDashboard /></ProtectedRoute>} />
                    <Route path="/technician-dashboard" element={<ProtectedRoute allowedRoles={['TECHNICIAN', 'OBSERVER', 'ADMIN']}><TechnicianDashboard /></ProtectedRoute>} />

                    {/* Ticket Management Routes */}
                    <Route path="/ticket-form" element={<ProtectedRoute allowedRoles={['CLIENT', 'OBSERVER']}><TicketForm /></ProtectedRoute>} />
                    <Route path="/tickets/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'OBSERVER', 'CLIENT', 'TECHNICIAN']}><TicketDetail /></ProtectedRoute>} />
                    <Route path="/filtered-tickets" element={<ProtectedRoute allowedRoles={['ADMIN', 'OBSERVER']}><FilteredTicketsPage /></ProtectedRoute>} />

                    {/* User Management Route */}
                    <Route path="/user-management" element={<ProtectedRoute allowedRoles={['ADMIN', 'OBSERVER']}><UserManagementPage /></ProtectedRoute>} />

                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

// Export the wrapped App to ensure AuthProvider is at the top level
export default AppWrapper;