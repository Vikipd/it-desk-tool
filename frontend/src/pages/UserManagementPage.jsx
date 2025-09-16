import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  FileDown,
  Edit,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { CSVLink } from "react-csv";
import api from "../api";
import { toast } from "react-hot-toast";
import UserModal from "../components/UserModal";
import ActionMenu from "../components/ActionMenu";

// --- THIS IS THE FIX: A helper function to map backend roles to frontend display names ---
const roleDisplayMap = {
  CLIENT: "Client",
  TECHNICIAN: "Engineer",
  ADMIN: "Admin",
  OBSERVER: "Project Manager",
};

const UserManagementPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", activeTab],
    queryFn: () => fetchUsers(activeTab),
  });

  const fetchUsers = async (tab) => {
    const isActive = tab === "active";
    const response = await api.get(`/api/users/?is_active=${isActive}`);
    return response.data;
  };

  const deactivateUserMutation = useMutation({
    mutationFn: (userId) => api.delete(`/api/users/${userId}/`),
    onSuccess: () => {
      toast.success("User deactivated.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Failed to deactivate user."),
  });

  const restoreUserMutation = useMutation({
    mutationFn: (userId) => api.post(`/api/users/${userId}/restore/`),
    onSuccess: () => {
      toast.success("User restored.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Failed to restore user."),
  });

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const csvHeaders = [
    { label: "Username", key: "username" },
    { label: "Full Name", key: "full_name" },
    { label: "Role", key: "role" },
    { label: "Phone Number", key: "phone_number" },
  ];
  const csvData = users.map((user) => ({
    ...user,
    full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
    role: roleDisplayMap[user.role] || user.role,
    phone_number: user.phone_number || "--",
  }));
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name &&
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActionsForUser = (user) => {
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
            if (window.confirm("Are you sure?")) {
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

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin-dashboard"
            className="text-gray-500 hover:text-gray-800"
          >
            <ChevronLeft size={28} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all members of your organization.
            </p>
          </div>
        </div>
        <CSVLink
          data={csvData}
          headers={csvHeaders}
          filename={"user_list_export.csv"}
          className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700"
        >
          <FileDown size={20} className="mr-2" /> Download
        </CSVLink>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex border-b mb-4">
          <TabButton
            title="Active Members"
            isActive={activeTab === "active"}
            onClick={() => setActiveTab("active")}
          />
          <TabButton
            title="Inactive Members"
            isActive={activeTab === "inactive"}
            onClick={() => setActiveTab("inactive")}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            All Members ({filteredUsers.length})
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Username
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Full Name
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Role
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Phone
                </th>
                <th className="py-3 px-6 text-center text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-800">
                      {user.username}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.full_name || `${user.first_name} ${user.last_name}`}
                    </td>
                    {/* --- FIX: Use the display map to show the correct role name --- */}
                    <td className="py-4 px-6 text-gray-600">
                      {roleDisplayMap[user.role] || user.role}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.phone_number || "--"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <ActionMenu actions={getActionsForUser(user)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

const TabButton = ({ title, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 px-4 text-sm font-semibold ${
      isActive
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500 hover:text-gray-700"
    }`}
  >
    {title}
  </button>
);

export default UserManagementPage;
