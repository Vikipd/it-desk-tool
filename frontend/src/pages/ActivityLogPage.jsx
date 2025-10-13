// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";

const actionDisplayMap = {
  USER_LOGIN: { label: "User Login", color: "bg-blue-100 text-blue-800" },
  TICKET_CREATED: {
    label: "Ticket Created",
    color: "bg-green-100 text-green-800",
  },
  STATUS_CHANGED: {
    label: "Status Changed",
    color: "bg-yellow-100 text-yellow-800",
  },
  TICKET_ASSIGNED: {
    label: "Ticket Assigned",
    color: "bg-purple-100 text-purple-800",
  },
};

const ActionBadge = ({ action }) => {
  const display = actionDisplayMap[action] || {
    label: action,
    color: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${display.color}`}
    >
      {display.label}
    </span>
  );
};

const ActivityLogPage = () => {
  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => api.get("/api/auth/me/"),
  });
  const username = profileData?.data?.username || "";

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    user: null,
    action: null,
    startDate: null,
    endDate: null,
  });

  const { data: usersData } = useQuery({
    queryKey: ["allUsersForFilter"],
    queryFn: () => api.get("/api/auth/users/"),
    select: (data) =>
      data.data.results.map((user) => ({
        value: user.id,
        label: user.username,
      })),
  });

  const actionOptions = Object.keys(actionDisplayMap).map((key) => ({
    value: key,
    label: actionDisplayMap[key].label,
  }));

  const { data, isLoading, error } = useQuery({
    queryKey: ["activityLog", currentPage, filters],
    queryFn: () => {
      const params = new URLSearchParams({ page: currentPage });
      if (filters.user) params.append("user", filters.user.value);
      if (filters.action) params.append("action", filters.action.value);
      if (filters.startDate)
        params.append(
          "start_date",
          filters.startDate.toISOString().split("T")[0]
        );
      if (filters.endDate)
        params.append("end_date", filters.endDate.toISOString().split("T")[0]);

      return api.get(`/api/tickets/activity-log/?${params.toString()}`);
    },
    keepPreviousData: true,
  });

  const logs = data?.data?.results || [];
  const totalCount = data?.data?.count || 0;
  const hasNextPage = data?.data?.next !== null;
  const hasPreviousPage = data?.data?.previous !== null;

  const handleFilterChange = (key, value) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const exportMutation = useMutation({
    mutationFn: () => {
      const params = new URLSearchParams();
      if (filters.user) params.append("user", filters.user.value);
      if (filters.action) params.append("action", filters.action.value);
      if (filters.startDate)
        params.append(
          "start_date",
          filters.startDate.toISOString().split("T")[0]
        );
      if (filters.endDate)
        params.append("end_date", filters.endDate.toISOString().split("T")[0]);
      // --- THIS IS THE FIX ---
      return api.get(`/api/tickets/activity-log/export/?${params.toString()}`);
    },
    onSuccess: (response) => {
      const allLogs = response.data;
      if (!allLogs || allLogs.length === 0) {
        toast.error("No logs to export with current filters.");
        return;
      }

      toast.success("Generating CSV...");
      const headers = ["Timestamp", "User", "Action", "Target", "Details"];
      const rows = allLogs.map((log) =>
        [
          `"${new Date(log.timestamp).toLocaleString()}"`,
          `"${log.user.username}"`,
          `"${log.action}"`,
          `"${log.target_object_id || ""}"`,
          `"${log.details}"`,
        ].join(",")
      );
      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `activity_log_export_${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: () => toast.error("Failed to export activity logs."),
  });

  return (
    <DashboardLayout
      pageTitle="User Activity Log"
      username={username}
      showExportButton={true}
      onExport={() => exportMutation.mutate()}
    >
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <Select
          options={usersData || []}
          onChange={(value) => handleFilterChange("user", value)}
          value={filters.user}
          isClearable={true}
          placeholder="Filter by User..."
        />
        <Select
          options={actionOptions}
          onChange={(value) => handleFilterChange("action", value)}
          value={filters.action}
          isClearable={true}
          placeholder="Filter by Action..."
        />
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => handleFilterChange("startDate", date)}
            selectsStart
            startDate={filters.startDate}
            endDate={filters.endDate}
            placeholderText="Start Date"
            className="w-full p-2 border rounded-md"
          />
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => handleFilterChange("endDate", date)}
            selectsEnd
            startDate={filters.startDate}
            endDate={filters.endDate}
            minDate={filters.startDate}
            placeholderText="End Date"
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-red-500">
                  <AlertTriangle className="h-8 w-8 mx-auto" /> Failed to load
                  logs.
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  No activity found for the selected filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {log.target_object_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-medium">
            {Math.min((currentPage - 1) * 10 + 1, totalCount)}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * 10, totalCount)}
          </span>{" "}
          of <span className="font-medium">{totalCount}</span> results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={!hasPreviousPage || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!hasNextPage || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogPage;
