// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState } from "react";
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
  Menu,
  X,
  BookUser, // Add the correct icon import
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NavLink = ({ to, icon, children, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <div className="relative group">
      <Link
        to={to}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
        } ${collapsed && "justify-center"}`}
      >
        {icon}
        {!collapsed && (
          <span className="ml-3 whitespace-nowrap">{children}</span>
        )}
      </Link>
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          {children}
        </div>
      )}
    </div>
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
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    queryClient.cancelQueries();
    localStorage.clear();
    queryClient.clear();
    navigate("/login");
    toast.success("Logged out successfully.");
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <aside
        className={`bg-white border-r border-slate-200 text-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-20 flex items-center justify-center p-4 border-b border-slate-200 shrink-0">
          {isSidebarCollapsed ? (
            <Link to="/admin-dashboard">
              <img
                src="/assets/images/favicon.png"
                alt="HFCL Icon"
                className="h-8 w-auto"
              />
            </Link>
          ) : (
            <div className="flex items-center space-x-2">
              <img
                src="/assets/images/hfcl.png"
                alt="HFCL Logo"
                className="h-10 w-auto"
              />
              <h2 className="text-lg font-semibold text-slate-700 whitespace-nowrap">
                ServiceDesk
              </h2>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {(role === "ADMIN" || role === "OBSERVER") && (
            <NavLink
              to="/admin-dashboard"
              icon={<LayoutDashboard size={20} />}
              collapsed={isSidebarCollapsed}
            >
              Admin Overview
            </NavLink>
          )}
          {(role === "CLIENT" || role === "ADMIN" || role === "OBSERVER") && (
            <NavLink
              to="/client-dashboard"
              icon={<Ticket size={20} />}
              collapsed={isSidebarCollapsed}
            >
              Client View
            </NavLink>
          )}
          {(role === "TECHNICIAN" ||
            role === "ADMIN" ||
            role === "OBSERVER") && (
            <NavLink
              to="/technician-dashboard"
              icon={<Users size={20} />}
              collapsed={isSidebarCollapsed}
            >
              Engineer View
            </NavLink>
          )}
          {(role === "ADMIN" || role === "OBSERVER") && (
            <NavLink
              to="/filtered-tickets"
              icon={<FileSearch size={20} />}
              collapsed={isSidebarCollapsed}
            >
              All Tickets
            </NavLink>
          )}
          <NavLink
            to="/contacts"
            icon={<BookUser size={20} />}
            collapsed={isSidebarCollapsed}
          >
            Contacts
          </NavLink>
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <div className="relative group">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-red-50 text-red-700 hover:bg-red-600 hover:text-white ${
                isSidebarCollapsed && "justify-center"
              }`}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && (
                <span className="ml-3 font-semibold">Logout</span>
              )}
            </button>
            {isSidebarCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                Logout
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-full mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-4"
                aria-label="Toggle sidebar"
              >
                {isSidebarCollapsed ? <Menu size={24} /> : <X size={24} />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
            </div>
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
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
