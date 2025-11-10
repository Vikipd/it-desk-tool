// Path: E:\it-admin-tool\frontend\src\pages\AdminDashboard.jsx
// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../AuthContext";
import api from "../api";
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
  Ticket,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Bell,
  Clock,
} from "lucide-react";
import UserModal from "../components/UserModal";
import DashboardLayout from "../layouts/DashboardLayout";

// --- THIS IS THE FINAL, CORRECTED, AND PROFESSIONAL CARD DESIGN ---
const DashboardCard = ({
  title,
  value,
  icon,
  to,
  isActionCard = false,
  isUserCard = false,
}) => {
  const cardClasses = isUserCard
    ? "bg-indigo-50 border-indigo-200"
    : isActionCard
    ? "bg-orange-50 border-orange-200"
    : "bg-white border-gray-200";
  const textClasses = isUserCard
    ? "text-indigo-600"
    : isActionCard
    ? "text-orange-600"
    : "text-gray-800";
  const iconBgClasses = isUserCard
    ? "bg-indigo-100"
    : isActionCard
    ? "bg-orange-100"
    : "bg-slate-100";
  const iconTextClasses = isUserCard
    ? "text-indigo-500"
    : isActionCard
    ? "text-orange-500"
    : "text-slate-500";

  const cardContent = (
    <div
      className={`${cardClasses} p-3 rounded-xl shadow-lg flex flex-col items-center justify-center text-center w-full h-full border hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
    >
      <div className={`p-2.5 rounded-full ${iconBgClasses} ${iconTextClasses}`}>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-bold ${textClasses} tracking-tight`}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-gray-500">{title}</p>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {cardContent}
      </Link>
    );
  }
  return cardContent;
};


const SlaPerformanceCard = ({
  priority,
  targetDays,
  avgOpenAge,
  openBreachedCount,
}) => {
  const hasBreachedTickets = openBreachedCount > 0;
  const displayDays = avgOpenAge;

  return (
    <div
      className={`p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${
        hasBreachedTickets ? "bg-red-50" : "bg-white"
      }`}
    >
      <div>
        <h3 className="font-bold text-gray-800 text-lg">{priority} Priority</h3>
      </div>

      {hasBreachedTickets && (
        <div className="mt-4 text-center">
          <p className="font-bold text-red-600">
            {openBreachedCount} Open Ticket{openBreachedCount > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-red-500">have breached their SLA</p>
        </div>
      )}

      <div className="my-4">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-gray-500 text-sm">Avg. Open Age:</span>
          <span
            className={`font-bold text-2xl ${
              hasBreachedTickets ? "text-red-600" : "text-gray-800"
            }`}
          >
            {displayDays.toFixed(1)} Days
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-gray-500 text-sm">SLA Target:</span>
          <span className="font-semibold text-gray-700">{targetDays} Days</span>
        </div>
      </div>
    </div>
  );
};

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminDashboardData"],
    queryFn: async () => {
      const [statsRes, profileRes] = await Promise.all([
        api.get("/api/tickets/dashboard-stats/"),
        api.get("/api/auth/me/"),
      ]);
      return { summary: statsRes.data, username: profileRes.data.username };
    },
  });

  const handleChartClick = (type, data) => {
    const { name } = data.payload;
    if (!name || name === "N/A") return;
    let queryParam = "";
    const inProgressStatuses = [
      "IN_PROGRESS",
      "IN_TRANSIT",
      "UNDER_REPAIR",
      "ON_HOLD",
    ];
    if (type === "status" && inProgressStatuses.includes(name)) {
      queryParam = `status=${inProgressStatuses.join(",")}`;
    } else {
      switch (type) {
        case "status":
          queryParam = `status=${name}`;
          break;
        case "priority":
          queryParam = `priority=${name}`;
          break;
        case "category":
          queryParam = `search=${encodeURIComponent(name)}`;
          break;
        default:
          return;
      }
    }
    navigate(`/filtered-tickets?${queryParam}`);
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error)
    return (
      <div className="p-8 text-center text-red-500">Failed to load data.</div>
    );

  const { summary = {}, username = "" } = data || {};

  const headerActions = (
    <>
      <button
        onClick={() => navigate("/ticket-form")}
        disabled={userRole === "OBSERVER"}
        className="flex items-center font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <PlusCircle size={16} className="mr-2" /> Submit Ticket
      </button>
      {userRole !== "OBSERVER" && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
        >
          <PlusCircle size={16} className="mr-2" /> Create User
        </button>
      )}
      <button
        onClick={() => navigate("/filtered-tickets")}
        className="flex items-center font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
      >
        <Ticket size={16} className="mr-2" /> View All Tickets
      </button>
    </>
  );

  return (
    <DashboardLayout
      pageTitle="Dashboard"
      username={username}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-10">
        <DashboardCard
          title="Total Tickets"
          value={summary.total_tickets || 0}
          icon={<Ticket size={24} />}
          to="/filtered-tickets"
        />
        <DashboardCard
          title="Open Tickets"
          value={summary.open_tickets || 0}
          icon={<AlertTriangle size={24} />}
          to="/filtered-tickets?status=OPEN"
        />
        <DashboardCard
          title="In Progress"
          value={summary.in_progress_tickets || 0}
          icon={<Clock size={24} />}
          to="/filtered-tickets?status=IN_PROGRESS,IN_TRANSIT,UNDER_REPAIR,ON_HOLD"
        />
        <DashboardCard
          title="Resolved Tickets"
          value={summary.resolved_tickets || 0}
          icon={<Bell size={24} />}
          to="/filtered-tickets?status=RESOLVED"
          isActionCard={true}
        />
        <DashboardCard
          title="Closed Tickets"
          value={summary.closed_tickets || 0}
          icon={<CheckCircle size={24} />}
          to="/filtered-tickets?status=CLOSED"
        />
        <DashboardCard
          title="Total Users"
          value={summary.total_users || 0}
          icon={<Users size={24} />}
          to="/user-management"
          isUserCard={true}
        />
      </div>
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Clock className="mr-3 text-gray-400" /> SLA Performance Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(summary.by_priority || []).map((priorityData) => (
            <SlaPerformanceCard
              key={priorityData.priority}
              priority={priorityData.priority}
              targetDays={priorityData.sla_target_days}
              avgOpenAge={priorityData.avg_open_age_days}
              openBreachedCount={priorityData.open_breached_count}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Tickets by Status</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={prepareChartData(summary.by_status, "status", "count")}
                  onClick={(data) => handleChartClick("status", data)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  className="cursor-pointer"
                >
                  {(summary.by_status || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Tickets by Priority</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={prepareChartData(
                    summary.by_priority,
                    "priority",
                    "count"
                  )}
                  onClick={(data) => handleChartClick("priority", data)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  className="cursor-pointer"
                >
                  {(summary.by_priority || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Tickets by Category</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={prepareChartData(
                    summary.by_category,
                    "card_category",
                    "count"
                  )}
                  onClick={(data) => handleChartClick("category", data)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  className="cursor-pointer"
                >
                  {(summary.by_category || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <UserModal
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["adminDashboardData"] });
          }}
        />
      )}
    </DashboardLayout>
  );
};
export default AdminDashboard;