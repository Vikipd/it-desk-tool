// COPY AND PASTE THIS ENTIRE BLOCK. THIS IS THE FINAL CLIENT DASHBOARD.

import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth.js";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
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
  Search,
} from "lucide-react";
import api from "../api.js";

const SummaryCard = ({ title, value, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
  >
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

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const fetchClientData = async () => {
    const params = { search: debouncedSearchTerm || undefined };
    const [ticketsResponse, profileResponse] = await Promise.all([
      api.get("/api/tickets/", { params }),
      api.get("/api/auth/me/"),
    ]);
    return {
      tickets: ticketsResponse.data.results || ticketsResponse.data,
      username: profileResponse.data.username,
    };
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ["clientDashboard", debouncedSearchTerm],
    queryFn: fetchClientData,
  });

  const { tickets = [], username = "" } = data || {};

  // --- THIS IS THE FIX: Added 'resolved' to the stats calculation ---
  const stats = useMemo(() => {
    if (!tickets) return { open: 0, resolved: 0, closed: 0, total: 0 };
    const openTickets = tickets.filter(
      (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
    ).length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === "RESOLVED"
    ).length;
    const closedTickets = tickets.filter((t) => t.status === "CLOSED").length;
    return {
      open: openTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      total: tickets.length,
    };
  }, [tickets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        `"${ticket.card?.node_name || "N/A"}"`,
        `"${
          ticket.card?.card_type || ticket.other_card_type_description || "N/A"
        }"`,
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

  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 text-red-600">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-xl font-semibold">{error.message}</p>
        <button
          onClick={() => queryClient.invalidateQueries(["clientDashboard"])}
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
            {/* --- THIS IS THE FIX: A professional and consistent welcome message --- */}
            <p className="text-sm text-gray-600 mt-1">
              Welcome, <span className="font-semibold">{username}</span>!
            </p>
          </div>
          <div className="flex space-x-3">
            {(role === "ADMIN" || role === "OBSERVER") && (
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="flex items-center font-semibold bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-sm"
              >
                <ArrowLeft size={18} className="mr-2" /> Back to Main Dashboard
              </button>
            )}
            {role === "CLIENT" && (
              <button
                onClick={() => navigate("/ticket-form")}
                className="flex items-center font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
              >
                <PlusCircle size={18} className="mr-2" /> Submit Ticket
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm"
            >
              <FileDown size={18} className="mr-2" /> Export
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center font-semibold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 shadow-sm"
            >
              <LogOut size={18} className="mr-2" /> Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* --- THIS IS THE FIX: The layout now uses 4 cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <SummaryCard
            title="Total Tickets"
            value={stats.total}
            icon={<Ticket size={24} className="text-blue-600" />}
            color="bg-blue-100"
            onClick={() => setSearchTerm("")}
          />
          <SummaryCard
            title="Open Tickets"
            value={stats.open}
            icon={<Clock size={24} className="text-yellow-600" />}
            color="bg-yellow-100"
            onClick={() => setSearchTerm("OPEN")}
          />
          <SummaryCard
            title="Resolved Tickets"
            value={stats.resolved}
            icon={<CheckCircle size={24} className="text-purple-600" />}
            color="bg-purple-100"
            onClick={() => setSearchTerm("RESOLVED")}
          />
          <SummaryCard
            title="Closed Tickets"
            value={stats.closed}
            icon={<CheckCircle size={24} className="text-green-600" />}
            color="bg-green-100"
            onClick={() => setSearchTerm("CLOSED")}
          />
        </div>
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200/80">
          <div className="p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {role === "OBSERVER"
                ? "All Client-Submitted Tickets"
                : "My Tickets"}
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search your tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
          {isLoading ? (
            <div className="text-center py-20 px-6">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full w-full">
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
                        {ticket.card?.node_name || "N/A"}
                      </td>
                      <td className="py-5 px-6 text-gray-800">
                        {ticket.card?.card_type ||
                          ticket.other_card_type_description ||
                          "N/A"}
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
