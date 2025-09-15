// D:\it-admin-tool\frontend\src\pages\AdminDashboard.jsx

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import React from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  LogOut,
  FileDown,
  Ticket,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
// --- FIX: Removed unused ACCESS_TOKEN and REFRESH_TOKEN imports ---

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#ff6666",
];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontWeight: "bold" }}
    >{`${(percent * 100).toFixed(0)}%`}</text>
  );
};
const prepareChartData = (data, nameKey, valueKey) =>
  Array.isArray(data)
    ? data.map((item) => ({
        name: item[nameKey] || "N/A",
        value: item[valueKey] || 0,
      }))
    : [];
const slaTargets = { Critical: 10, High: 20, Medium: 30, Low: 40 };
const SlaPerformanceCard = ({ priority, targetDays, summary }) => {
  const byPriority = summary.by_priority || [];
  const priorityData = byPriority.find((p) => p.priority === priority);
  const actualDays = priorityData
    ? parseFloat(priorityData.avg_resolution_days).toFixed(1)
    : "0.0";
  const isBreached = parseFloat(actualDays) > targetDays;
  const performancePercentage =
    actualDays > 0
      ? Math.min((targetDays / parseFloat(actualDays)) * 100, 100)
      : 100;
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div>
        <h3 className="font-bold text-gray-800 text-lg">{priority} Priority</h3>
        <p
          className={`text-sm font-semibold flex items-center mt-1 ${
            isBreached ? "text-red-500" : "text-green-500"
          }`}
        >
          {isBreached ? (
            <TrendingDown className="mr-2" size={18} />
          ) : (
            <TrendingUp className="mr-2" size={18} />
          )}
          {isBreached ? "SLA Breached" : "SLA Met"}
        </p>
      </div>
      <div className="my-4">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-gray-500 text-sm">Actual Avg:</span>
          <span className="font-bold text-2xl text-gray-800">
            {actualDays} Days
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-gray-500 text-sm">SLA Target:</span>
          <span className="font-semibold text-gray-700">{targetDays} Days</span>
        </div>
      </div>
      <div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              isBreached ? "bg-red-500" : "bg-green-500"
            }`}
            style={{
              width: `${isBreached ? "100%" : performancePercentage + "%"}`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminDashboardData"],
    queryFn: async () => {
      const [summaryRes, ticketsRes] = await Promise.all([
        api.get("/api/tickets/dashboard-stats/"),
        api.get("/api/tickets/?ordering=-created_at&limit=5"),
      ]);
      return {
        summary: summaryRes.data,
        recentTickets: ticketsRes.data.results || ticketsRes.data,
      };
    },
  });

  const handleExport = () => {
    if (!data?.recentTickets || data.recentTickets.length === 0) {
      toast.error("No recent ticket data to export.");
      return;
    }
    toast.success("Generating your CSV export...");
    const headers = [
      "Ticket ID",
      "Node Name",
      "Status",
      "Priority",
      "Assigned To",
    ];
    const rows = data.recentTickets.map((ticket) =>
      [
        `"${ticket.ticket_id}"`,
        `"${ticket.node_name}"`,
        `"${ticket.status}"`,
        `"${ticket.priority}"`,
        `"${ticket.assigned_to_username || "Unassigned"}"`,
      ].join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "recent_tickets_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.clear();
    queryClient.clear();
    navigate("/login");
    toast.success("You have been logged out.");
  };

  if (isLoading)
    return <div className="p-8 text-center">Loading dashboard data...</div>;
  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load dashboard data.
      </div>
    );

  const summary = data?.summary || {};
  const recentTickets = data?.recentTickets || [];
  const closedTicketsCount =
    summary.by_status?.find((s) => s.status === "CLOSED")?.count || 0;
  const openTicketsCount =
    summary.by_status
      ?.filter((s) => s.status !== "CLOSED")
      .reduce((acc, current) => acc + current.count, 0) || 0;
  const summaryCards = [
    {
      title: "Total Tickets",
      value: summary.total_tickets || 0,
      icon: <Ticket size={24} />,
    },
    {
      title: "Open Tickets",
      value: openTicketsCount,
      icon: <AlertTriangle size={24} />,
    },
    {
      title: "Closed Tickets",
      value: closedTicketsCount,
      icon: <CheckCircle size={24} />,
    },
    {
      title: "Total Users",
      value: summary.total_users || 0,
      icon: <Users size={24} />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            ResolveFlow Dashboard
          </h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/create-user")}
              disabled={role === "OBSERVER"}
              className="flex items-center font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <PlusCircle size={18} className="mr-2" /> Create User
            </button>
            <button
              onClick={() => navigate("/filtered-tickets")}
              className="flex items-center font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              <Ticket size={18} className="mr-2" /> View All Tickets
            </button>
            <button
              onClick={handleExport}
              className="flex items-center font-semibold bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm"
            >
              <FileDown size={18} className="mr-2" /> Export
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center font-semibold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm"
            >
              <LogOut size={18} className="mr-2" /> Logout
            </button>
          </div>
        </div>
      </header>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center space-x-6 border-b">
            <NavLink to="/admin-dashboard">Admin Overview</NavLink>
            <NavLink to="/client-dashboard">Client View</NavLink>
            <NavLink to="/technician-dashboard">Technician View</NavLink>
            <NavLink to="/filtered-tickets">All Tickets (Filtered)</NavLink>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="bg-white p-6 rounded-xl shadow-lg flex items-center"
            >
              <div className="mr-5 p-3 rounded-full bg-slate-100 text-slate-600">
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-800 tracking-tight">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-4 flex items-center">
            <Clock className="mr-3 text-gray-400" />
            SLA Performance Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(slaTargets).map(([priority, days]) => (
              <SlaPerformanceCard
                key={priority}
                priority={priority}
                targetDays={days}
                summary={summary}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {[
            {
              title: "Tickets by Status",
              data: summary.by_status,
              nameKey: "status",
              valueKey: "count",
            },
            {
              title: "Tickets by Priority",
              data: summary.by_priority,
              nameKey: "priority",
              valueKey: "count",
            },
            {
              title: "Tickets by Category",
              data: summary.by_category,
              nameKey: "card_category",
              valueKey: "count",
            },
          ].map((chart) => (
            <div
              key={chart.title}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-800 tracking-tight mb-4">
                {chart.title}
              </h3>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={prepareChartData(
                        chart.data,
                        chart.nameKey,
                        chart.valueKey
                      )}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={5}
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {(chart.data || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-4">
            Recent Tickets
          </h2>
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200/80">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                    Ticket ID
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                    Node Name
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                    Assigned To
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTickets.length > 0 ? (
                  recentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="text-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="py-4 px-6 font-semibold text-blue-700">
                        {ticket.ticket_id}
                      </td>
                      <td className="py-4 px-6 text-gray-800">
                        {ticket.node_name}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {ticket.status}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {ticket.priority}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {ticket.assigned_to_username || "Unassigned"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500">
                      No recent tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`py-4 px-1 inline-flex items-center text-sm font-semibold ${
        isActive
          ? "border-b-2 border-blue-600 text-blue-600"
          : "border-b-2 border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </Link>
  );
};

export default AdminDashboard;
