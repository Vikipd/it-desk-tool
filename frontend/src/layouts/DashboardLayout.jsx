// Path: E:\it-admin-tool\frontend\src\layouts\DashboardLayout.jsx
// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  BookUser,
  History,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import api from "../api";
import { REFRESH_TOKEN } from "../constants";

const SessionTimeoutModal = ({ isOpen, onStay, onLogout, countdown }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Session Expiring</h2>
        <p className="mt-2 text-gray-600">
          You have been inactive. You will be logged out automatically in{" "}
          <span className="font-bold">{countdown}</span> seconds.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
          >
            Logout
          </button>
          <button
            onClick={onStay}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

const useIdleTimer = ({ timeout, warningTimeout, onIdle, onWarning }) => {
  const logoutTimer = useRef();
  const warningTimer = useRef();

  const resetTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);

    warningTimer.current = setTimeout(() => {
      onWarning(true);
    }, warningTimeout);

    logoutTimer.current = setTimeout(() => {
      onIdle();
    }, timeout);
  }, [timeout, warningTimeout, onIdle, onWarning]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];
    
    const handleActivity = () => {
      resetTimers();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeout(warningTimer.current);
      clearTimeout(logoutTimer.current);
    };
  }, [resetTimers]);

  return { resetTimers };
};

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
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
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
  const { userRole, logout } = useAuth();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isWarningModalOpen, setWarningModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const countdownTimer = useRef();

  // --- THIS IS THE FINAL FIX ---
  const handleLogout = useCallback(async () => {
    // 1. Set up the local cleanup function to run regardless of API success/failure.
    const finalCleanup = () => {
      setWarningModalOpen(false);
      clearInterval(countdownTimer.current);
      logout();
      queryClient.clear();
      navigate("/login");
      toast.success("You have been logged out.");
    };

    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    try {
      // 2. AWAIT the API call to ensure it completes before we continue.
      if (refreshToken) {
        await api.post("/api/auth/logout/", { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed, but logging out locally anyway.", error);
    } finally {
      // 3. Run the cleanup function.
      finalCleanup();
    }
  }, [logout, navigate, queryClient]);
  
  const { resetTimers } = useIdleTimer({
    timeout: 30 * 60 * 1000,
    warningTimeout: 28 * 60 * 1000,
    onIdle: handleLogout,
    onWarning: setWarningModalOpen,
  });

  const handleStayLoggedIn = () => {
    setWarningModalOpen(false);
    clearInterval(countdownTimer.current);
    resetTimers();
  };

  useEffect(() => {
    if (isWarningModalOpen) {
      setCountdown(120);
      countdownTimer.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(countdownTimer.current);
    }
    return () => clearInterval(countdownTimer.current);
  }, [isWarningModalOpen]);


  const getHomeDashboardUrl = () => {
    switch (userRole) {
      case "ADMIN":
      case "OBSERVER":
        return "/admin-dashboard";
      case "CLIENT":
        return "/client-dashboard";
      case "TECHNICIAN":
        return "/technician-dashboard";
      default:
        return "/login";
    }
  };

  return (
    <>
      <div className="flex h-screen bg-slate-100 font-sans">
        <aside
          className={`bg-white border-r border-slate-200 text-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          <div className="h-20 flex items-center justify-center p-4 border-b border-slate-200 shrink-0">
            {isSidebarCollapsed ? (
              <Link to={getHomeDashboardUrl()}>
                <img
                  src="/assets/images/favicon.png"
                  alt="HFCL Icon"
                  className="h-8 w-auto"
                />
              </Link>
            ) : (
              <Link
                to={getHomeDashboardUrl()}
                className="flex items-center space-x-2"
              >
                <img
                  src="/assets/images/hfcl.png"
                  alt="HFCL Logo"
                  className="h-10 w-auto"
                />
                <h2 className="text-lg font-semibold text-slate-700 whitespace-nowrap">
                  ServiceDesk
                </h2>
              </Link>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {(userRole === "ADMIN" || userRole === "OBSERVER") && (
              <NavLink
                to="/admin-dashboard"
                icon={<LayoutDashboard size={20} />}
                collapsed={isSidebarCollapsed}
              >
                Admin Overview
              </NavLink>
            )}
            {(userRole === "CLIENT" ||
              userRole === "ADMIN" ||
              userRole === "OBSERVER") && (
              <NavLink
                to="/client-dashboard"
                icon={<Ticket size={20} />}
                collapsed={isSidebarCollapsed}
              >
                Client View
              </NavLink>
            )}
            {(userRole === "TECHNICIAN" ||
              userRole === "ADMIN" ||
              userRole === "OBSERVER") && (
              <NavLink
                to="/technician-dashboard"
                icon={<Users size={20} />}
                collapsed={isSidebarCollapsed}
              >
                Engineer View
              </NavLink>
            )}
            {(userRole === "ADMIN" || userRole === "OBSERVER") && (
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
            {(userRole === "ADMIN" || userRole === "OBSERVER") && (
              <NavLink
                to="/activity-log"
                icon={<History size={20} />}
                collapsed={isSidebarCollapsed}
              >
                Activity Log
              </NavLink>
            )}
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
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
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
      <SessionTimeoutModal
        isOpen={isWarningModalOpen}
        onStay={handleStayLoggedIn}
        onLogout={handleLogout}
        countdown={countdown}
      />
    </>
  );
};
export default DashboardLayout;