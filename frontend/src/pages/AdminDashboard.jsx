// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK. THE BUG IS FIXED.

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import UserModal from "../components/UserModal";
import DashboardLayout from "../layouts/DashboardLayout";

const DashboardCard = ({
  title,
  value,
  icon,
  to,
  isActionCard = false,
  isUserCard = false,
}) => {
  const cardClasses = isUserCard
    ? "bg-indigo-100 border-2 border-indigo-400"
    : isActionCard
    ? "bg-orange-100 border-2 border-orange-400"
    : "bg-white";
  const textClasses = isUserCard
    ? "text-indigo-600"
    : isActionCard
    ? "text-orange-600"
    : "text-gray-800";
  const iconBgClasses = isUserCard
    ? "bg-indigo-200"
    : isActionCard
    ? "bg-orange-200"
    : "bg-slate-100";
  const iconTextClasses = isUserCard
    ? "text-indigo-600"
    : isActionCard
    ? "text-orange-600"
    : "text-slate-600";
  const cardContent = (
    <div
      className={`${cardClasses} p-6 rounded-xl shadow-lg flex items-center w-full h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
    >
      <div
        className={`mr-5 p-3 rounded-full ${iconBgClasses} ${iconTextClasses}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-3xl font-bold ${textClasses} tracking-tight`}>
          {value}
        </p>
      </div>
    </div>
  );
  if (to)
    return (
      <Link to={to} className="block">
        {cardContent}
      </Link>
    );
  return cardContent;
};

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
  const { role } = useAuth();
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
    // --- MODIFICATION: IF THE STATUS IS ONE OF THE "IN PROGRESS" TYPES, COMBINE THEM ---
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
  const slaTargets = { CRITICAL: 10, HIGH: 20, MEDIUM: 30, LOW: 40 };
  const headerActions = (
    <>
      <button
        onClick={() => navigate("/ticket-form")}
        disabled={role === "OBSERVER"}
        className="flex items-center font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <PlusCircle size={16} className="mr-2" /> Submit Ticket
      </button>
      {role !== "OBSERVER" && (
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
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
        {/* --- MODIFICATION: THIS IS THE CORRECT LINK FOR THE "IN PROGRESS" CARD --- */}
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
