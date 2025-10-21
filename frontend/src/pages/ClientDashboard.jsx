// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../AuthContext"; // --- THIS IS THE FIX ---
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Loader2,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Ticket,
  CheckCircle,
  Clock,
  Search,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../api.js";
import DashboardLayout from "../layouts/DashboardLayout";

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
  const { userRole } = useAuth(); // Changed from role to userRole for consistency
  const [username, setUsername] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeStatusFilter, setActiveStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isClientViewForAdmin = userRole === "ADMIN" || userRole === "OBSERVER";

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboardStats", "clientView", userRole],
    queryFn: async () => {
      const statsUrl = isClientViewForAdmin
        ? "/api/tickets/dashboard-stats/?view_as=client"
        : "/api/tickets/dashboard-stats/";
      const [profileResponse, statsResponse] = await Promise.all([
        api.get("/api/auth/me/"),
        api.get(statsUrl),
      ]);
      return {
        username: profileResponse.data.username,
        stats: statsResponse.data,
      };
    },
  });

  const {
    data: ticketsData,
    error: ticketsError,
    isLoading: isTicketsLoading,
  } = useQuery({
    queryKey: [
      "tickets",
      "clientView",
      userRole,
      activeStatusFilter,
      searchTerm,
      currentPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (isClientViewForAdmin) {
        params.append("created_by__role", "CLIENT");
      }
      if (activeStatusFilter) {
        const statusString = Array.isArray(activeStatusFilter)
          ? activeStatusFilter.join(",")
          : activeStatusFilter;
        params.append("status", statusString);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      params.append("page", currentPage);
      const response = await api.get(`/api/tickets/?${params.toString()}`);
      return response.data;
    },
    keepPreviousData: true,
  });

  const { username: fetchedUsername = "", stats = {} } = statsData || {};
  const { results: paginatedTickets = [], count: totalFilteredTickets = 0 } =
    ticketsData || {};

  useEffect(() => {
    if (fetchedUsername) setUsername(fetchedUsername);
  }, [fetchedUsername]);

  const ticketsPerPage = 10;
  const totalPages = Math.ceil(totalFilteredTickets / ticketsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const handleCardClick = (status) => {
    setCurrentPage(1);
    setSearchTerm("");
    setActiveStatusFilter(status);
  };

  const handleSearchChange = (e) => {
    setCurrentPage(1);
    setSearchTerm(e.target.value);
  };

  const exportMutation = useMutation({
    mutationFn: () => {
      const params = new URLSearchParams();
      if (isClientViewForAdmin) {
        params.append("created_by__role", "CLIENT");
      }
      if (activeStatusFilter) {
        const statusString = Array.isArray(activeStatusFilter)
          ? activeStatusFilter.join(",")
          : activeStatusFilter;
        params.append("status", statusString);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      return api.get(`/api/tickets/export-all/?${params.toString()}`);
    },
    onSuccess: (response) => {
      const ticketsToExport = response.data;
      if (!ticketsToExport || ticketsToExport.length === 0) {
        toast.error("No tickets to export.");
        return;
      }
      const date = new Date();
      const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}_${date
        .getHours()
        .toString()
        .padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}`;
      const defaultFilename = `client_tickets_export_${timestamp}.csv`;
      const filename = prompt(
        "Please enter a filename for your export:",
        defaultFilename
      );
      if (filename === null) {
        toast.error("Export cancelled.");
        return;
      }
      toast.success("Generating CSV...");
      const headers = [
        "Ticket ID",
        "Node Name",
        "Category",
        "Status",
        "Priority",
        "Created By",
        "Assigned To",
        "Created At",
        "Closed At",
      ];
      const rows = ticketsToExport.map((ticket) =>
        [
          `"${ticket.ticket_id}"`,
          `"${ticket.card?.node_name || "N/A"}"`,
          `"${ticket.card?.card_type || "N/A"}"`,
          `"${ticket.status}"`,
          `"${ticket.priority}"`,
          `"${ticket.created_by?.username || "N/A"}"`,
          `"${ticket.assigned_to?.username || "N/A"}"`,
          `"${new Date(ticket.created_at).toLocaleString()}"`,
          `"${
            ticket.closed_at ? new Date(ticket.closed_at).toLocaleString() : ""
          }"`,
        ].join(",")
      );
      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        filename.endsWith(".csv") ? filename : `${filename}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: () => toast.error("Failed to fetch data for export."),
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
      case "IN_TRANSIT":
      case "UNDER_REPAIR":
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-purple-100 text-purple-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (ticketsError)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 text-red-600">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-xl font-semibold">{ticketsError.message}</p>
        <button
          onClick={() =>
            queryClient.invalidateQueries(["tickets", "clientView"])
          }
          className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );

  const headerActions = (
    <>
      <button
        onClick={() => navigate("/ticket-form")}
        disabled={userRole !== "CLIENT"}
        className="flex items-center font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 shadow-sm text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <PlusCircle size={16} className="mr-2" /> Submit Ticket
      </button>
      {(userRole === "ADMIN" || userRole === "OBSERVER") && (
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="flex items-center font-semibold bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-sm text-sm"
        >
          <LayoutDashboard size={16} className="mr-2" /> Back to Dashboard
        </button>
      )}
    </>
  );

  return (
    <DashboardLayout
      pageTitle={userRole === "CLIENT" ? "Client Dashboard" : "Client View"}
      username={username}
      onExport={() => exportMutation.mutate()}
      showExportButton={true}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <SummaryCard
          title="Total Tickets"
          value={isStatsLoading ? "..." : stats.total_tickets || 0}
          icon={<Ticket size={24} className="text-blue-600" />}
          color="bg-blue-100"
          onClick={() => handleCardClick(null)}
        />
        <SummaryCard
          title="Open Tickets"
          value={isStatsLoading ? "..." : stats.open_tickets || 0}
          icon={<Clock size={24} className="text-blue-600" />}
          color="bg-blue-100"
          onClick={() => handleCardClick("OPEN")}
        />
        <SummaryCard
          title="In Progress"
          value={isStatsLoading ? "..." : stats.in_progress_tickets || 0}
          icon={<Clock size={24} className="text-yellow-600" />}
          color="bg-yellow-100"
          onClick={() =>
            handleCardClick([
              "IN_PROGRESS",
              "IN_TRANSIT",
              "UNDER_REPAIR",
              "ON_HOLD",
            ])
          }
        />
        <SummaryCard
          title="Resolved Tickets"
          value={isStatsLoading ? "..." : stats.resolved_tickets || 0}
          icon={<CheckCircle size={24} className="text-purple-600" />}
          color="bg-purple-100"
          onClick={() => handleCardClick("RESOLVED")}
        />
        <SummaryCard
          title="Closed Tickets"
          value={isStatsLoading ? "..." : stats.closed_tickets || 0}
          icon={<CheckCircle size={24} className="text-green-600" />}
          color="bg-green-100"
          onClick={() => handleCardClick("CLOSED")}
        />
      </div>
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200/80">
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            {userRole === "CLIENT"
              ? "My Tickets"
              : "All Client-Submitted Tickets"}
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
        {isTicketsLoading ? (
          <div className="text-center py-20 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : paginatedTickets.length > 0 ? (
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
                  {isClientViewForAdmin && (
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Created By
                    </th>
                  )}
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                    Created At
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                    Closed At
                  </th>
                  <th className="py-3 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    className="text-sm cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <td className="py-5 px-6 text-gray-600">
                      {(currentPage - 1) * ticketsPerPage + index + 1}
                    </td>
                    <td className="py-5 px-6 font-semibold text-blue-700">
                      {ticket.ticket_id}
                    </td>
                    <td className="py-5 px-6 text-gray-800">
                      {ticket.card?.node_name || "N/A"}
                    </td>
                    <td className="py-5 px-6 text-gray-800">
                      {ticket.card?.card_type || "N/A"}
                    </td>
                    <td className="py-5 px-6">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-gray-600">
                      {ticket.priority}
                    </td>
                    {isClientViewForAdmin && (
                      <td className="py-5 px-6 text-gray-600 font-medium">
                        {ticket.created_by?.username || "N/A"}
                      </td>
                    )}
                    <td className="py-5 px-6 text-gray-600">
                      {new Date(ticket.created_at).toLocaleString()}
                    </td>
                    <td className="py-5 px-6 text-gray-600">
                      {ticket.closed_at
                        ? new Date(ticket.closed_at).toLocaleString()
                        : "---"}
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
              {userRole === "CLIENT"
                ? "You haven't submitted any support tickets yet."
                : "No client tickets match the current filters."}
            </p>
            {userRole === "CLIENT" && (
              <button
                onClick={() => navigate("/ticket-form")}
                className="mt-6 font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
              >
                Create Your First Ticket
              </button>
            )}
          </div>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-medium">
            {Math.min(
              (currentPage - 1) * ticketsPerPage + 1,
              totalFilteredTickets
            )}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * ticketsPerPage, totalFilteredTickets)}
          </span>{" "}
          of <span className="font-medium">{totalFilteredTickets}</span> results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default ClientDashboard;
