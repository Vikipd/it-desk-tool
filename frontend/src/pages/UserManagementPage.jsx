// Path: E:\it-admin-tool\frontend\src/pages/UserManagementPage.jsx
// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Edit,
  Trash2,
  RotateCcw,
  PlusCircle,
  Loader2,
} from "lucide-react";
import Select from "react-select";
import { CSVLink } from "react-csv";
import api from "../api";
import { toast } from "react-hot-toast";
import UserModal from "../components/UserModal";
import ActionMenu from "../components/ActionMenu";
import { useAuth } from "../AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";

const roleDisplayMap = {
  CLIENT: "Client",
  TECHNICIAN: "Engineer",
  ADMIN: "Admin",
  OBSERVER: "Project Manager",
};

// --- FIX 1: Options for the new Role Filter dropdown ---
const roleFilterOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "TECHNICIAN", label: "Engineer" },
  { value: "CLIENT", label: "Client" },
  { value: "OBSERVER", label: "Project Manager" },
];

const UserManagementPage = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState(null); // State for the new filter
  const usersPerPage = 10;

  const [csvData, setCsvData] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [csvFilename, setCsvFilename] = useState("");
  const csvLinkRef = useRef(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get("/api/auth/me/");
        setCurrentUser(res.data);
      } catch (e) {
        console.error("Failed to fetch current user", e);
      }
    };
    fetchCurrentUser();
  }, []);
  
  // This effect resets the page to 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]); // --- FIX 2: Also reset page when roleFilter changes ---

  // --- FIX 3: Add roleFilter to the queryKey ---
  const queryKey = ["users", activeTab, searchTerm, roleFilter, currentPage];

  const { data, isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const isActive = activeTab === "active";
      // --- FIX 4: Add roleFilter to the API request parameters ---
      const params = {
        is_active: isActive,
        search: searchTerm || undefined,
        role: roleFilter ? roleFilter.value : undefined,
        page: currentPage,
      };
      const response = await api.get(`/api/auth/users/`, { params });
      return response.data;
    },
    keepPreviousData: true,
  });

  const users = data?.results || [];
  const totalCount = data?.count || 0;
  const hasNextPage = data?.next !== null;
  const hasPreviousPage = data?.previous !== null;

  useEffect(() => {
    if (csvData.length > 0 && csvLinkRef.current) {
      csvLinkRef.current.link.click();
      setCsvData([]); 
      setCsvFilename("");
    }
  }, [csvData]);

  const deactivateUserMutation = useMutation({
    mutationFn: (userId) => api.delete(`/api/auth/users/${userId}/`),
    onSuccess: () => {
      toast.success("User deactivated.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Failed to deactivate user."),
  });

  const restoreUserMutation = useMutation({
    mutationFn: (userId) => api.post(`/api/auth/users/${userId}/restore/`),
    onSuccess: () => {
      toast.success("User restored.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Failed to restore user."),
  });

  const handleOpenEditModal = (user) => {
    if (userRole === "OBSERVER") return;
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && (!totalCount || newPage <= Math.ceil(totalCount / usersPerPage))) {
      setCurrentPage(newPage);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const isActive = activeTab === "active";
      // --- FIX 5: Add roleFilter to the export API call ---
      const params = {
        is_active: isActive,
        search: searchTerm || undefined,
        role: roleFilter ? roleFilter.value : undefined,
        export: 'true',
      };
      const response = await api.get("/api/auth/users/", { params });
      
      const exportedUserCount = response.data.length;
      const dataToExport = response.data.map((user, index) => ({
        "S.No": index + 1,
        Username: user.username,
        "Full Name": user.full_name || `${user.first_name} ${user.last_name}`.trim(),
        Email: user.email || "--",
        Role: roleDisplayMap[user.role] || user.role,
        Zone: user.zone || "--",
        "Phone Number": user.phone_number || "--",
      }));

      const date = new Date().toISOString().split("T")[0];
      const filename = `users-${activeTab}-${exportedUserCount}-records-${date}.csv`;
      setCsvFilename(filename);
      setCsvData(dataToExport);

    } catch (error) {
      toast.error("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  const csvHeaders = [
    { label: "S.No", key: "S.No" },
    { label: "Username", key: "Username" },
    { label: "Full Name", key: "Full Name" },
    { label: "Email", key: "Email" },
    { label: "Role", key: "Role" },
    { label: "Zone", key: "Zone" },
    { label: "Phone Number", key: "Phone Number" },
  ];

  const getActionsForUser = (user) => {
    if (user.id === currentUser?.id) {
      return [
        {
          label: "Edit My Details",
          icon: <Edit size={16} className="mr-3" />,
          onClick: () => handleOpenEditModal(user),
        },
      ];
    }
    
    if (activeTab === "active") {
      return [
        {
          label: "Edit User",
          icon: <Edit size={16} className="mr-3" />,
          onClick: () => handleOpenEditModal(user),
        },
        {
          label: "Deactivate User",
          icon: <Trash2 size={16} className="mr-3" />,
          className: "text-red-600",
          onClick: () => {
            if (window.confirm("Are you sure you want to deactivate this user?")) {
              deactivateUserMutation.mutate(user.id);
            }
          },
        },
      ];
    }

    return [
      {
        label: "Restore User",
        icon: <RotateCcw size={16} className="mr-3" />,
        className: "text-green-600",
        onClick: () => restoreUserMutation.mutate(user.id),
      },
    ];
  };

  const headerActions = (
    <>
      <Link
        to="/admin-dashboard"
        className="flex items-center font-semibold bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-sm text-sm"
      >
        <ChevronLeft size={16} className="mr-2" /> Back to Dashboard
      </Link>
      {userRole !== "OBSERVER" && (
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
        >
          <PlusCircle size={16} className="mr-2" /> Create User
        </button>
      )}
    </>
  );

  return (
    <DashboardLayout
      pageTitle="User Management"
      username={currentUser?.username}
      headerActions={headerActions}
    >
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex border-b mb-4">
          <TabButton
            title="Active Members"
            isActive={activeTab === "active"}
            onClick={() => {
              setActiveTab("active");
              setCurrentPage(1);
            }}
            count={activeTab === 'active' ? totalCount : undefined}
          />
          <TabButton
            title="Inactive Members"
            isActive={activeTab === "inactive"}
            onClick={() => {
              setActiveTab("inactive");
              setCurrentPage(1);
            }}
            count={activeTab === 'inactive' ? totalCount : undefined}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
            {/* --- FIX 6: Add the new Role Filter Select component --- */}
            <div className="w-48">
              <Select
                options={roleFilterOptions}
                value={roleFilter}
                onChange={setRoleFilter}
                isClearable={true}
                placeholder="Filter by Role..."
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || totalCount === 0}
            className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm disabled:bg-gray-400"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown size={16} className="mr-2" />
                Download CSV
              </>
            )}
          </button>
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename={csvFilename}
            ref={csvLinkRef}
            className="hidden"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase w-16">
                  S.No
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Username
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Full Name
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Email
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Role
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Zone
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Phone
                </th>
                {userRole !== "OBSERVER" && (
                  <th className="py-3 px-6 text-center text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={userRole !== "OBSERVER" ? 8 : 7}
                    className="text-center py-10"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-600">
                      {(currentPage - 1) * usersPerPage + index + 1}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-800">
                      {user.username}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.full_name || `${user.first_name} ${user.last_name}`}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.email || "--"}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {roleDisplayMap[user.role] || user.role}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.zone || "--"}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.phone_number || "--"}
                    </td>
                    {userRole !== "OBSERVER" && (
                      <td className="py-4 px-6 text-center">
                        <ActionMenu actions={getActionsForUser(user)} />
                      </td>
                    )}
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
              {Math.min((currentPage - 1) * usersPerPage + 1, totalCount)}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * usersPerPage, totalCount)}
            </span>{" "}
            of <span className="font-medium">{totalCount}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPreviousPage}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </DashboardLayout>
  );
};

const TabButton = ({ title, isActive, onClick, count }) => (
  <button
    onClick={onClick}
    className={`py-2 px-4 text-sm font-semibold flex items-center gap-2 ${
      isActive
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500 hover:text-gray-700"
    }`}
  >
    {title}
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
        {count}
      </span>
    )}
  </button>
);

export default UserManagementPage;