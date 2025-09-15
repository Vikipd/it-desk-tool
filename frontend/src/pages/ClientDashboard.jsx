// D:\it-admin-tool\frontend\src\pages\ClientDashboard.jsx

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth.js";
import React, { useEffect, useState, useCallback } from "react";
// --- FIX: Corrected the typo from 'router-dom' to 'react-router-dom' ---
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
// --- FIX: Silenced the intentional 'ArrowLeft' unused variable warning ---
// eslint-disable-next-line no-unused-vars
import {
  Loader2,
  AlertTriangle,
  PlusCircle,
  LogOut,
  FileDown,
  ArrowRight,
  Ticket,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import api from "../api.js";

const SummaryCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center">
      <div className={`mr-5 p-3 rounded-full ${color}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  </div>
);

const ClientDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState({ open: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ticketsResponse, profileResponse] = await Promise.all([
        api.get("/api/tickets/"),
        api.get("/api/auth/me/"),
      ]);

      const allTickets = ticketsResponse.data.results || ticketsResponse.data;
      setTickets(allTickets);

      // --- FIX: This line uses 'profileResponse', fixing both the warning and the UI bug ---
      setUsername(profileResponse.data.username);

      const openTickets = allTickets.filter(
        (t) => t.status !== "CLOSED" && t.status !== "RESOLVED"
      ).length;
      const closedTickets = allTickets.filter(
        (t) => t.status === "CLOSED" || t.status === "RESOLVED"
      ).length;
      setStats({ open: openTickets, closed: closedTickets });
    } catch (err) {
      console.error("Failed to fetch client data:", err);
      setError("Failed to fetch your tickets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleExport = () => {
    if (!tickets || tickets.length === 0) {
      toast.error("You have no tickets to export.");
      return;
    }
    toast.success("Generating your CSV export...");
    const headers = [
      "Ticket ID",
      "Node Name",
      "Category",
      "Status",
      "Priority",
      "Created At",
    ];
    const rows = tickets.map((ticket) =>
      [
        `"${ticket.ticket_id}"`,
        `"${ticket.node_name}"`,
        `"${ticket.card_category}"`,
        `"${ticket.status}"`,
        `"${ticket.priority}"`,
        `"${new Date(ticket.created_at).toLocaleString()}"`,
      ].join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "my_tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    queryClient.clear();
    toast.success("Logged out successfully.");
  };
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
      case "IN_TRANSIT":
      case "UNDER_REPAIR":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-purple-100 text-purple-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 text-red-600">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-xl font-semibold">{error}</p>
        <button
          onClick={fetchClientData}
          className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {role === "OBSERVER"
                ? "Client Tickets Overview"
                : "Client Dashboard"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, <span className="font-semibold">{username}</span>!
            </p>
          </div>
          <div className="flex space-x-3">
            {(role === "ADMIN" || role === "OBSERVER") && (
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="flex items-center font-semibold bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <ArrowLeft size={18} className="mr-2" /> Back to Main Dashboard
              </button>
            )}
            {role === "CLIENT" && (
              <button
                onClick={() => navigate("/ticket-form")}
                className="flex items-center font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <PlusCircle size={18} className="mr-2" /> Submit Ticket
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <FileDown size={18} className="mr-2" /> Export
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center font-semibold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <LogOut size={18} className="mr-2" /> Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <SummaryCard
            title="Total Tickets"
            value={tickets.length}
            icon={<Ticket size={24} className="text-blue-600" />}
            color="bg-blue-100"
          />
          <SummaryCard
            title="Open Tickets"
            value={stats.open}
            icon={<Clock size={24} className="text-yellow-600" />}
            color="bg-yellow-100"
          />
          <SummaryCard
            title="Closed Tickets"
            value={stats.closed}
            icon={<CheckCircle size={24} className="text-green-600" />}
            color="bg-green-100"
          />
        </div>
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200/80">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {role === "OBSERVER"
                ? "All Client-Submitted Tickets"
                : "My Tickets"}
            </h2>
          </div>
          {tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      S.No
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Ticket ID
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Node Name
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Created At
                    </th>
                    <th className="py-3 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.map((ticket, index) => (
                    <tr
                      key={ticket.id}
                      className="text-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="py-5 px-6 text-gray-600">{index + 1}</td>
                      <td className="py-5 px-6 font-semibold text-blue-700">
                        {ticket.ticket_id}
                      </td>
                      <td className="py-5 px-6 text-gray-800">
                        {ticket.node_name}
                      </td>
                      <td className="py-5 px-6 text-gray-600">
                        {ticket.card_category}
                      </td>
                      <td className="py-5 px-6">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-gray-600">
                        {ticket.priority}
                      </td>
                      <td className="py-5 px-6 text-gray-600">
                        {new Date(ticket.created_at).toLocaleString()}
                      </td>
                      <td className="py-5 px-6 text-gray-400">
                        <ArrowRight size={18} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 px-6">
              <h3 className="text-xl font-semibold text-gray-800">
                No tickets found
              </h3>
              <p className="text-gray-500 mt-2">
                {role === "OBSERVER"
                  ? "No tickets submitted by any client."
                  : "You haven't submitted any support tickets yet."}
              </p>
              <button
                onClick={() => navigate("/ticket-form")}
                disabled={role === "OBSERVER"}
                className="mt-6 font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                Create Your First Ticket
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
