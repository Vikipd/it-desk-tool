// D:\it-admin-tool\frontend\src\pages\FilteredTickets.jsx

import { useAuth } from "../hooks/useAuth.js";
import React, { useEffect, useState, useCallback } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { zonesData } from "../data/locationsData";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AssigneeDropdown = ({ ticket, technicians, onAssignmentChange }) => {
  /* ... unchanged, correct logic ... */ const [isAssigning, setIsAssigning] =
    useState(false);
  const technicianOptions = technicians.map((tech) => ({
    value: tech.id,
    label: tech.username,
  }));
  const currentAssignee = technicianOptions.find(
    (option) => option.value === ticket.assigned_to
  );
  const handleAssign = async (selectedOption) => {
    setIsAssigning(true);
    try {
      const response = await api.patch(`/api/tickets/${ticket.id}/`, {
        assigned_to: selectedOption ? selectedOption.value : null,
      });
      toast.success(`Ticket ${response.data.ticket_id} assigned!`);
      onAssignmentChange();
    } catch (error) {
      console.error("Assignment failed:", error);
      toast.error("Failed to assign ticket.");
    } finally {
      setIsAssigning(false);
    }
  };
  return (
    <Select
      options={technicianOptions}
      value={currentAssignee}
      onChange={handleAssign}
      isLoading={isAssigning}
      placeholder="Assign to..."
      className="min-w-[150px] text-sm"
      isClearable={true}
    />
  );
};
const statusDropdownOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "UNDER_REPAIR", label: "Under Repair" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];
const priorityDropdownOptions = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const FilteredTicketsPage = () => {
  // --- All state and logic is correct and unchanged ---
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [circleFilter, setCircleFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [mainCardCategories, setMainCardCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { role } = useAuth();
  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const res = await api.get("/api/tickets/card-main-categories/");
        setMainCardCategories(
          res.data.map((category) => ({ value: category, label: category }))
        );
      } catch (err) {
        console.error("Failed to fetch main card categories", err);
        setError("Could not load filter options.");
      }
    };
    fetchMainCategories();
  }, []);
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await api.get("/api/technicians/");
        setTechnicians(response.data);
      } catch (err) {
        console.error("Failed to fetch technicians:", err);
        if (role === "ADMIN") {
          toast.error("Could not load technicians.");
        }
      }
    };
    if (role === "ADMIN") {
      fetchTechnicians();
    }
  }, [role]);
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params = {
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      card_category: categoryFilter || undefined,
      circle: circleFilter || undefined,
      start_date: startDate ? startDate.toISOString().split("T")[0] : undefined,
      end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
    };
    try {
      const res = await api.get("/api/tickets/", { params });
      setTickets(res.data.results || res.data);
    } catch (err) {
      console.error("Error fetching filtered tickets", err);
      if (err.response?.status === 401) navigate("/login");
      setError("Failed to fetch tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [
    statusFilter,
    priorityFilter,
    categoryFilter,
    circleFilter,
    navigate,
    startDate,
    endDate,
  ]);
  useEffect(() => {
    const timer = setTimeout(fetchTickets, 300);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  // ==============================================================================
  // --- START OF THE DEFINITIVE FIX: handleExport now uses the reliable frontend method ---
  // ==============================================================================
  const handleExport = () => {
    if (!tickets || tickets.length === 0) {
      toast.error("No tickets found for the selected filters to export.");
      return;
    }
    toast.success("Generating your CSV export...");
    const headers = [
      "S.No",
      "Ticket ID",
      "Node Name",
      "Card Category",
      "Status",
      "Priority",
      "Circle",
      "Assigned To",
      "Created At",
    ];
    const rows = tickets.map((ticket, index) =>
      [
        `${index + 1}`,
        `"${ticket.ticket_id}"`,
        `"${ticket.node_name}"`,
        `"${ticket.card_category}"`,
        `"${ticket.status}"`,
        `"${ticket.priority}"`,
        `"${ticket.circle}"`,
        `"${ticket.assigned_to_username || "Unassigned"}"`,
        `"${new Date(ticket.created_at).toLocaleString()}"`,
      ].join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "filtered_tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // ==============================================================================
  // --- END OF THE DEFINITIVE FIX ---
  // ==============================================================================

  const handleBackToDashboard = () => navigate("/admin-dashboard");
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (isLoading && tickets.length === 0)
    return <div className="text-center p-10">Loading tickets...</div>;
  if (error)
    return <div className="text-center text-red-500 p-10">{error}</div>;

  return (
    // ... The rest of your JSX is correct and unchanged ...
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Filtered Tickets</h1>
        <div className="flex space-x-4 items-center">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm"
          >
            Export to Excel
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          <div className="md:col-span-1">
            <Select
              options={statusDropdownOptions}
              onChange={(opt) => setStatusFilter(opt?.value || "")}
              isClearable={true}
              placeholder="Select Status"
              className="text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <Select
              options={priorityDropdownOptions}
              onChange={(opt) => setPriorityFilter(opt?.value || "")}
              isClearable={true}
              placeholder="Select Priority"
              className="text-sm"
            />
          </div>
          <div className="md-col-span-1">
            <Select
              options={mainCardCategories}
              onChange={(opt) => setCategoryFilter(opt?.value || "")}
              isClearable={true}
              placeholder="Select Category"
              className="text-sm"
            />
          </div>
          <div className="md-col-span-1">
            <Select
              options={zonesData}
              onChange={(opt) => setCircleFilter(opt?.label || "")}
              isClearable={true}
              placeholder="Select Circle"
              className="text-sm"
            />
          </div>
          <div className="md-col-span-1">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start Date"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              isClearable={true}
            />
          </div>
          <div className="md-col-span-1">
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="End Date"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              isClearable={true}
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                S.No
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Node Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Card Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Circle
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Assign To
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket, index) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                <td
                  className="px-6 py-4 text-sm text-blue-600 hover:underline cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  {ticket.ticket_id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {ticket.node_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {ticket.card_category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {ticket.status}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {ticket.priority}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {ticket.circle}
                </td>
                <td className="px-6 py-4 text-sm">
                  {ticket.assigned_to ? (
                    <span className="text-gray-900 font-medium">
                      {ticket.assigned_to_username}
                    </span>
                  ) : role === "ADMIN" ? (
                    <AssigneeDropdown
                      ticket={ticket}
                      technicians={technicians}
                      onAssignmentChange={fetchTickets}
                    />
                  ) : (
                    <span className="text-gray-500 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(ticket.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FilteredTicketsPage;
