// COPY AND PASTE THIS ENTIRE BLOCK. THIS IS THE FINAL AND CORRECTED VERSION.

import React, { useEffect, useState, useCallback } from "react";
import api from "../api.js";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, LogOut, Download, Search } from "lucide-react";
import Select from "react-select";
import { useAuth } from "../hooks/useAuth.js";
// --- MODIFICATION: We need both useMutation and useQuery from React Query ---
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function useQueryParams() {
  return new URLSearchParams(useLocation().search);
}

// The AssigneeDropdown component is now perfect and handles its own logic.
const AssigneeDropdown = ({ ticket, technicians }) => {
  const queryClient = useQueryClient();
  const technicianOptions = technicians.map((tech) => ({
    value: tech.id,
    label: tech.username,
  }));

  const assignMutation = useMutation({
    mutationFn: (assigneeId) => {
      return api.patch(`/api/tickets/${ticket.id}/`, {
        assigned_to: assigneeId,
      });
    },
    onSuccess: () => {
      toast.success(`Ticket ${ticket.ticket_id} has been assigned!`);
      // This refetches the data, which updates the UI to show the static text.
      queryClient.invalidateQueries({ queryKey: ["filteredTickets"] });
    },
    onError: () => {
      toast.error("Failed to assign ticket.");
    },
  });

  const handleAssign = (selectedOption) => {
    assignMutation.mutate(selectedOption ? selectedOption.value : null);
  };

  return (
    // This div stops the click from navigating away.
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        options={technicianOptions}
        onChange={handleAssign}
        isLoading={assignMutation.isPending}
        placeholder="Assign..."
        className="min-w-[150px] text-sm"
        isClearable={false}
      />
    </div>
  );
};

const statusDropdownOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
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
  const navigate = useNavigate();
  const { role } = useAuth();
  const urlQuery = useQueryParams();

  // State for filters is still managed by useState
  const [statusFilter, setStatusFilter] = useState(
    urlQuery.get("status") || ""
  );
  const [priorityFilter, setPriorityFilter] = useState(
    urlQuery.get("priority") || ""
  );
  const [searchFilter, setSearchFilter] = useState(
    urlQuery.get("search") || ""
  );

  // State for technicians list
  const [technicians, setTechnicians] = useState([]);

  // --- THIS IS THE CORRECTED DATA FETCHING LOGIC ---
  const fetchTickets = useCallback(async () => {
    const params = {
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      search: searchFilter || undefined,
    };
    const res = await api.get("/api/tickets/", { params });
    return res.data.results || res.data;
  }, [statusFilter, priorityFilter, searchFilter]);

  // We use the `useQuery` hook to fetch and cache the ticket data.
  const { data: tickets = [], isLoading } = useQuery({
    // The queryKey is important. It includes the filters so that
    // if a filter changes, React Query knows to refetch the data.
    queryKey: ["filteredTickets", statusFilter, priorityFilter, searchFilter],
    queryFn: fetchTickets,
  });

  useEffect(() => {
    const fetchTechnicians = async () => {
      if (role === "ADMIN") {
        try {
          const response = await api.get("/api/technicians/");
          setTechnicians(response.data);
        } catch (err) {
          toast.error("Could not load technician list.");
        }
      }
    };
    fetchTechnicians();
  }, [role]);

  const handleExport = () => {
    if (!tickets || tickets.length === 0) {
      toast.error("No tickets to export.");
      return;
    }
    toast.success("Generating CSV...");
    const headers = [
      "S.No",
      "Ticket ID",
      "Node Name",
      "Card Type",
      "Status",
      "Priority",
      "Zone",
      "Assigned To",
      "Created At",
    ];
    const rows = tickets.map((ticket, index) =>
      [
        index + 1,
        `"${ticket.ticket_id}"`,
        `"${ticket.card?.node_name || ""}"`,
        `"${
          ticket.card?.card_type || ticket.other_card_type_description || ""
        }"`,
        `"${ticket.status}"`,
        `"${ticket.priority}"`,
        `"${ticket.card?.zone || ""}"`,
        `"${ticket.assigned_to_username || "Unassigned"}"`,
        `"${new Date(ticket.created_at).toLocaleString()}"`,
      ].join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "filtered_tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Filtered Tickets</h1>
        <div className="flex space-x-4 items-center">
          <Link
            to="/admin-dashboard"
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm"
          >
            <Download className="h-4 w-4 mr-2" /> Export
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 relative">
            <input
              type="text"
              placeholder="Search by Ticket ID, Node, Status, Priority..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          <Select
            options={statusDropdownOptions}
            value={statusDropdownOptions.find(
              (opt) => opt.value === statusFilter
            )}
            onChange={(opt) => setStatusFilter(opt?.value || "")}
            isClearable={true}
            placeholder="Select Status"
          />
          <Select
            options={priorityDropdownOptions}
            value={priorityDropdownOptions.find(
              (opt) => opt.value === priorityFilter
            )}
            onChange={(opt) => setPriorityFilter(opt?.value || "")}
            isClearable={true}
            placeholder="Select Priority"
          />
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                S.No
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                Node Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                Card Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                Zone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                Assign To
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="9" className="text-center py-10">
                  Loading...
                </td>
              </tr>
            ) : (
              tickets.map((ticket, index) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <td className="px-6 py-4 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                    {ticket.ticket_id}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ticket.card?.node_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ticket.card?.card_type || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm">{ticket.status}</td>
                  <td className="px-6 py-4 text-sm">{ticket.priority}</td>
                  <td className="px-6 py-4 text-sm">
                    {ticket.card?.zone || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {/* --- THIS IS THE FINAL, CORRECT LOGIC --- */}
                    {ticket.assigned_to_username ? (
                      <span className="font-medium">
                        {ticket.assigned_to_username}
                      </span>
                    ) : (
                      <AssigneeDropdown
                        ticket={ticket}
                        technicians={technicians}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(ticket.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FilteredTicketsPage;
