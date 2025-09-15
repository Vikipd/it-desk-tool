import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/useAuth"; // Import our new hook

// Import all your pages
import CreateUser from './pages/CreateUser';
import Login from "./pages/Login";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TicketForm from "./pages/TicketForm";
import TicketDetail from "./pages/TicketDetail";
import FilteredTicketsPage from "./pages/FilteredTicketsPage";
import TechnicianDashboard from "./pages/TechnicianDashboard";

const queryClient = new QueryClient();

// The final, robust ProtectedRoute, now powered by the central useAuth hook.
const ProtectedRoute = ({ allowedRoles, children }) => {
    const { isAuthenticated, role } = useAuth(); // Use the hook

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Toaster position="top-center" reverseOrder={false} />
                <Routes>
                    {/* Your Routes configuration is correct. */}
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/create-user" element={<ProtectedRoute allowedRoles={['ADMIN']}><CreateUser /></ProtectedRoute>} />
                    
                    <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'OBSERVER']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/client-dashboard" element={<ProtectedRoute allowedRoles={['CLIENT', 'OBSERVER', 'ADMIN']}><ClientDashboard /></ProtectedRoute>} />
                    <Route path="/technician-dashboard" element={<ProtectedRoute allowedRoles={['TECHNICIAN', 'OBSERVER', 'ADMIN']}><TechnicianDashboard /></ProtectedRoute>} />

                    <Route path="/ticket-form" element={<ProtectedRoute allowedRoles={['CLIENT', 'OBSERVER']}><TicketForm /></ProtectedRoute>} />
                    <Route path="/tickets/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'OBSERVER', 'CLIENT', 'TECHNICIAN']}><TicketDetail /></ProtectedRoute>} />
                    <Route path="/filtered-tickets" element={<ProtectedRoute allowedRoles={['ADMIN', 'OBSERVER']}><FilteredTicketsPage /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

export default App;