import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Loader2,
  AlertTriangle,
  LogOut,
  ArrowRight,
  Ticket,
  Clock,
  ArrowLeft,
} from "lucide-react";
import api from "../api.js";
import { useAuth } from "../hooks/useAuth.js";

const SummaryCard = ({ title, value, icon, color, to }) => {
  const content = (
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
  if (to) return <Link to={to}>{content}</Link>;
  return content;
};

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState({ inProgress: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTechnicianData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ticketsResponse, profileResponse] = await Promise.all([
        api.get("/api/tickets/"),
        api.get("/api/auth/me/"),
      ]);

      const assignedTickets =
        ticketsResponse.data.results || ticketsResponse.data;
      setTickets(assignedTickets);
      setUsername(profileResponse.data.username);

      const inProgressTickets = assignedTickets.filter(
        (t) =>
          t.status === "IN_PROGRESS" ||
          t.status === "IN_TRANSIT" ||
          t.status === "UNDER_REPAIR"
      ).length;
      setStats({
        inProgress: inProgressTickets,
        total: assignedTickets.length,
      });
    } catch (err) {
      setError("Failed to load tickets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechnicianData();
  }, [fetchTechnicianData]);

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
          onClick={fetchTechnicianData}
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
                ? "Engineer Tickets Overview"
                : "Engineer Dashboard"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome, <span className="font-semibold">{username}</span>!
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {(role === "ADMIN" || role === "OBSERVER") && (
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="flex items-center font-semibold bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-sm"
              >
                <ArrowLeft size={18} className="mr-2" /> Back to Main Dashboard
              </button>
            )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <SummaryCard
            title="Total Assigned Tickets"
            value={stats.total}
            icon={<Ticket size={24} className="text-blue-600" />}
            color="bg-blue-100"
            to="/filtered-tickets"
          />
          <SummaryCard
            title="Tickets In Progress"
            value={stats.inProgress}
            icon={<Clock size={24} className="text-yellow-600" />}
            color="bg-yellow-100"
            to="/filtered-tickets?status=IN_PROGRESS"
          />
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200/80">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {role === "OBSERVER"
                ? "All Assigned Tickets"
                : "My Assigned Tickets"}
            </h2>
          </div>
          {tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Ticket ID
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Node Name
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                      Card Type
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
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="text-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="py-5 px-6 font-semibold text-blue-700">
                        {ticket.ticket_id}
                      </td>
                      <td className="py-5 px-6 text-gray-800 font-medium">
                        {ticket.card?.node_name || "N/A"}
                      </td>
                      <td className="py-5 px-6 text-gray-800">
                        {ticket.card?.card_type ||
                          ticket.other_card_type_description ||
                          "N/A"}
                      </td>
                      <td className="py-5 px-6">
                        <span
                          className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
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
                {role === "OBSERVER"
                  ? "No tickets are currently assigned"
                  : "No tickets assigned to you"}
              </h3>
              <p className="text-gray-500 mt-2">
                {role === "OBSERVER"
                  ? "This view shows tickets actively assigned to engineers."
                  : "Check back later for new assignments."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TechnicianDashboard;
