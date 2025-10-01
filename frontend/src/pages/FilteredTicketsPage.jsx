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
import { useAuth } from "../hooks/useAuth.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

function useQueryParams() {
  return new URLSearchParams(useLocation().search);
}

const AssigneeDropdown = ({ ticket, technicians }) => {
  const queryClient = useQueryClient();
  const technicianOptions = technicians.map((tech) => ({
    value: tech.id,
    label: tech.username,
  }));
  const assignMutation = useMutation({
    mutationFn: (assigneeId) =>
      api.patch(`/api/tickets/${ticket.id}/`, { assigned_to: assigneeId }),
    onSuccess: () => {
      toast.success(`Ticket ${ticket.ticket_id} has been assigned!`);
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
  const { role } = useAuth();
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
  const [technicians, setTechnicians] = useState([]);
  const [username, setUsername] = useState("");

  const fetchTickets = useCallback(
    async (page) => {
      const params = {
        page: page,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchFilter || undefined,
      };
      const res = await api.get("/api/tickets/", { params });
      return res.data;
    },
    [statusFilter, priorityFilter, searchFilter]
  );

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: [
      "filteredTickets",
      currentPage,
      statusFilter,
      priorityFilter,
      searchFilter,
    ],
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
    setCurrentPage(parseInt(params.get("page")) || 1);
  }, [location.search]);

  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        const profileRes = await api.get("/api/auth/me/");
        setUsername(profileRes.data.username);
        if (role === "ADMIN") {
          const techResponse = await api.get("/api/technicians/");
          setTechnicians(techResponse.data);
        }
      } catch (err) {
        toast.error("Could not load required page data.");
      }
    };
    fetchRequiredData();
  }, [role]);

  const exportMutation = useMutation({
    mutationFn: () => {
      const params = {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchFilter || undefined,
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
          `"${ticket.created_by_username || ""}"`,
          `"${ticket.assigned_to_username || "Unassigned"}"`,
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
      {(role === "ADMIN" || role === "OBSERVER") && (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-1 relative">
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
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                S.No
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Node Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Card Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Zone
              </th>
              {(role === "ADMIN" || role === "OBSERVER") && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created By
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(currentPage - 1) * 10 + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 hover:underline">
                    {ticket.ticket_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.card?.node_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.card?.card_type || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.card?.zone || "N/A"}
                  </td>
                  {(role === "ADMIN" || role === "OBSERVER") && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {ticket.created_by_username}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {ticket.assigned_to_username ? (
                      <span className="font-medium">
                        {ticket.assigned_to_username}
                      </span>
                    ) : role === "ADMIN" ? (
                      <AssigneeDropdown
                        ticket={ticket}
                        technicians={technicians}
                      />
                    ) : (
                      "Unassigned"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {new Date(ticket.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
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
