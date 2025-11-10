// Path: E:\it-admin-tool\frontend\src\pages\FilteredTicketsPage.jsx
// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useEffect, useState, useCallback } from "react";
import api from "../api.js";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Search,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Select from "react-select";
import { useAuth } from "../AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

function useQueryParams() {
  return new URLSearchParams(useLocation().search);
}

const formatOptions = (data) =>
  data ? data.map((item) => ({ value: item, label: item })) : [];

// --- THIS IS THE FIX for the Dropdown Menu ---
const AssigneeDropdown = ({ ticket, technicians, queryKey }) => {
  const queryClient = useQueryClient();
  
  // FIX 1: Display full name and username for clarity
  const technicianOptions = technicians.map((tech) => ({
    value: tech.id,
    label: `${tech.first_name} ${tech.last_name} (${tech.username})`,
  }));

  const assignMutation = useMutation({
    mutationFn: ({ ticketId, assigneeId }) =>
      api.patch(`/api/tickets/${ticketId}/`, { assigned_to: assigneeId }),
    onSuccess: (data) => {
      toast.success(`Ticket ${data.data.ticket_id} has been assigned!`);
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onError: () => {
      toast.error("Failed to assign ticket.");
    },
  });

  const handleAssign = (selectedOption) => {
    assignMutation.mutate({
      ticketId: ticket.id,
      assigneeId: selectedOption ? selectedOption.value : null,
    });
  };

  const currentValue = technicianOptions.find(
    (opt) => opt.value === ticket.assigned_to?.id
  );

  return (
    <div onClick={(e) => e.stopPropagation()} className="w-48">
      <Select
        options={technicianOptions}
        value={currentValue}
        onChange={handleAssign}
        isLoading={
          assignMutation.isPending &&
          assignMutation.variables?.ticketId === ticket.id
        }
        placeholder="Assign..."
        isClearable={false}
        // FIX 2: Render the dropdown menu in the body, not the table cell
        menuPortalTarget={document.body}
        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
      />
    </div>
  );
};

const statusDropdownOptions = [
  { value: "OPEN", label: "Open" },
  {
    value: "IN_PROGRESS,IN_TRANSIT,UNDER_REPAIR,ON_HOLD",
    label: "In Progress",
  },
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
  const location = useLocation();
  const { userRole } = useAuth();
  const urlQuery = useQueryParams();

  const [currentPage, setCurrentPage] = useState(
    parseInt(urlQuery.get("page")) || 1
  );
  const [statusFilter, setStatusFilter] = useState(
    urlQuery.get("status") || ""
  );
  const [priorityFilter, setPriorityFilter] = useState(
    urlQuery.get("priority") || ""
  );
  const [searchFilter, setSearchFilter] = useState(
    urlQuery.get("search") || ""
  );
  const [stateFilter, setStateFilter] = useState(urlQuery.get("state") || "");
  const [technicians, setTechnicians] = useState([]);
  const [username, setUsername] = useState("");

  const { data: states, isLoading: isLoadingStates } = useQuery({
    queryKey: ["states"],
    queryFn: () => api.get("/api/tickets/states/").then((res) => res.data),
  });
  const stateDropdownOptions = formatOptions(states);

  const fetchTickets = useCallback(
    async (page) => {
      const params = {
        page: page,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchFilter || undefined,
        state: stateFilter || undefined,
      };
      const res = await api.get("/api/tickets/", { params });
      return res.data;
    },
    [statusFilter, priorityFilter, searchFilter, stateFilter]
  );

  const queryKey = [
    "filteredTickets",
    currentPage,
    statusFilter,
    priorityFilter,
    searchFilter,
    stateFilter,
  ];

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchTickets(currentPage),
  });

  const tickets = paginatedData?.results || [];
  const totalCount = paginatedData?.count || 0;
  const hasNextPage = paginatedData?.next !== null;
  const hasPreviousPage = paginatedData?.previous !== null;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setStatusFilter(params.get("status") || "");
    setPriorityFilter(params.get("priority") || "");
    setSearchFilter(params.get("search") || "");
    setStateFilter(params.get("state") || "");
    setCurrentPage(parseInt(params.get("page")) || 1);
  }, [location.search]);

  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        const profileRes = await api.get("/api/auth/me/");
        setUsername(profileRes.data.username);
        if (userRole === "ADMIN" || userRole === "OBSERVER") {
          const techResponse = await api.get("/api/auth/technicians/");
          setTechnicians(techResponse.data);
        }
      } catch (err) {
        toast.error("Could not load required page data.");
      }
    };
    fetchRequiredData();
  }, [userRole]);

  const exportMutation = useMutation({
    mutationFn: () => {
      const params = {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchFilter || undefined,
        state: stateFilter || undefined,
      };
      return api.get("/api/tickets/export-all/", { params });
    },
    onSuccess: (response) => {
      const allTickets = response.data;
      if (!allTickets || allTickets.length === 0) {
        toast.error("No tickets found with the current filters to export.");
        return;
      }
      const date = new Date();
      const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}_${date
        .getHours()
        .toString()
        .padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}`;
      const defaultFilename = `tickets_export_${timestamp}.csv`;
      const filename = prompt(
        "Please enter a filename for your export:",
        defaultFilename
      );
      if (filename === null) {
        toast.error("Export cancelled.");
        return;
      }
      toast.success("Generating CSV for all matching tickets...");
      const headers = [
        "S.No",
        "Ticket ID",
        "Node Name",
        "Card Type",
        "Status",
        "Priority",
        "Zone",
        "State",
        "Created By",
        "Assigned To",
        "Created At",
        "Closed At",
      ];
      const rows = allTickets.map((ticket, index) =>
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
          `"${ticket.card?.state || ""}"`,
          `"${ticket.created_by?.username || ""}"`,
          `"${ticket.assigned_to?.username || "Unassigned"}"`,
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
    onError: () => {
      toast.error("Failed to fetch data for export.");
    },
  });

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set("page", newPage);
    navigate(`?${params.toString()}`);
  };

  const headerActions = (
    <>
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
      pageTitle="Filtered Tickets"
      username={username}
      onExport={() => exportMutation.mutate()}
      showExportButton={true}
      headerActions={headerActions}
    >
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        {/* --- THIS IS THE FIX for the Filter Layout --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by Ticket ID, Node, Status, Priority..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onBlur={() => handleFilterChange("search", searchFilter)}
              onKeyPress={(e) =>
                e.key === "Enter" && handleFilterChange("search", searchFilter)
              }
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            onChange={(option) =>
              handleFilterChange("status", option ? option.value : "")
            }
            isClearable={true}
            placeholder="Select Status..."
          />
          <Select
            options={priorityDropdownOptions}
            value={priorityDropdownOptions.find(
              (opt) => opt.value === priorityFilter
            )}
            onChange={(option) =>
              handleFilterChange("priority", option ? option.value : "")
            }
            isClearable={true}
            placeholder="Select Priority"
          />
          <Select
            options={stateDropdownOptions}
            isLoading={isLoadingStates}
            value={stateDropdownOptions.find(
              (opt) => opt.value === stateFilter
            )}
            onChange={(option) =>
              handleFilterChange("state", option ? option.value : "")
            }
            isClearable={true}
            placeholder="Select State..."
          />
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                S.No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-40">
                Ticket ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Node Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-28">
                Card Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-32">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-28">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-24">
                Zone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-24">
                State
              </th>
              {(userRole === "ADMIN" || userRole === "OBSERVER") && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-36">
                  Created By
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-52">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-48">
                Created At
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-48">
                Closed At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="12" className="text-center py-10 text-gray-500">
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center py-10 text-gray-500">
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((ticket, index) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(currentPage - 1) * 10 + index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 hover:underline">
                    {ticket.ticket_id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 truncate">
                    {ticket.card?.node_name || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.card?.card_type || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.status}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.priority}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.card?.zone || "N/A"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.card?.state || "N/A"}
                  </td>
                  {(userRole === "ADMIN" || userRole === "OBSERVER") && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                      {ticket.created_by?.username}
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.assigned_to?.username ? (
                      <span className="font-medium">
                        {ticket.assigned_to.username}
                      </span>
                    ) : userRole === "ADMIN" || userRole === "OBSERVER" ? (
                      <AssigneeDropdown
                        ticket={ticket}
                        technicians={technicians}
                        queryKey={queryKey}
                      />
                    ) : (
                      "Unassigned"
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {new Date(ticket.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.closed_at
                      ? new Date(ticket.closed_at).toLocaleString()
                      : "---"}
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
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPreviousPage || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
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
export default FilteredTicketsPage;