// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT LAYOUT.

import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  LogOut,
  LayoutDashboard,
  Ticket,
  Users,
  FileSearch,
  Download,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Footer from "../components/Footer"; // <-- IMPORT THE NEW FOOTER

const NavLink = ({ to, icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
      }`}
    >
      {icon}
      <span className="ml-3">{children}</span>
    </Link>
  );
};

const DashboardLayout = ({
  pageTitle,
  username,
  children,
  onExport,
  showExportButton = false,
  headerActions = null,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const handleLogout = () => {
    queryClient.cancelQueries();
    localStorage.clear();
    queryClient.clear();
    navigate("/login");
    toast.success("Logged out successfully.");
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 text-slate-800 flex flex-col">
        <div className="h-32 flex flex-col items-center justify-center p-4 bg-slate-100 border-b border-slate-200">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <img
              src="/assets/images/hfcl.png"
              alt="HFCL Logo"
              className="h-14 w-auto"
            />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mt-3">
            HFCL ServiceDesk
          </h2>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {(role === "ADMIN" || role === "OBSERVER") && (
            <NavLink to="/admin-dashboard" icon={<LayoutDashboard size={20} />}>
              Admin Overview
            </NavLink>
          )}
          {(role === "CLIENT" || role === "ADMIN" || role === "OBSERVER") && (
            <NavLink to="/client-dashboard" icon={<Ticket size={20} />}>
              Client View
            </NavLink>
          )}
          {(role === "TECHNICIAN" ||
            role === "ADMIN" ||
            role === "OBSERVER") && (
            <NavLink to="/technician-dashboard" icon={<Users size={20} />}>
              Engineer View
            </NavLink>
          )}
          {(role === "ADMIN" || role === "OBSERVER") && (
            <NavLink to="/filtered-tickets" icon={<FileSearch size={20} />}>
              All Tickets
            </NavLink>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-red-50 text-red-700 hover:bg-red-600 hover:text-white"
          >
            <LogOut size={20} />
            <span className="ml-3 font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-full mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
            <div className="flex items-center space-x-4">
              {headerActions}
              {showExportButton && (
                <button
                  onClick={onExport}
                  className="flex items-center font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm text-sm"
                >
                  <Download size={16} className="mr-2" /> Export
                </button>
              )}
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{username}</span>
              </span>
            </div>
          </div>
        </header>

        {/* --- MODIFICATION: MAIN CONTENT AND FOOTER --- */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-6 lg:p-8">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
