// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK. THE FILTER IS FIXED.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  FileDown,
  Edit,
  Trash2,
  RotateCcw,
  PlusCircle,
} from "lucide-react";
import { CSVLink } from "react-csv";
import api from "../api";
import { toast } from "react-hot-toast";
import UserModal from "../components/UserModal";
import ActionMenu from "../components/ActionMenu";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../layouts/DashboardLayout";

const roleDisplayMap = {
  CLIENT: "Client",
  TECHNICIAN: "Engineer",
  ADMIN: "Admin",
  OBSERVER: "Project Manager",
};

const UserManagementPage = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);

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

  const fetchUsers = async (tab) => {
    const isActive = tab === "active";
    const response = await api.get(`/api/users/?is_active=${isActive}`);
    return response.data;
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", activeTab],
    queryFn: () => fetchUsers(activeTab),
  });

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
    if (role === "OBSERVER") return;
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

  const csvHeaders = [
    { label: "Username", key: "username" },
    { label: "Full Name", key: "full_name" },
    { label: "Email", key: "email" },
    { label: "Role", key: "role" },
    { label: "Phone Number", key: "phone_number" },
  ];
  const csvData = users.map((user) => ({
    ...user,
    full_name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
    email: user.email || "--",
    role: roleDisplayMap[user.role] || user.role,
    phone_number: user.phone_number || "--",
  }));

  // --- MODIFICATION: SEARCH LOGIC NOW INCLUDES ROLE AND PHONE ---
  const filteredUsers = users.filter((user) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const userRole = (roleDisplayMap[user.role] || user.role).toLowerCase();

    return (
      user.username.toLowerCase().includes(lowerCaseSearchTerm) ||
      (user.full_name &&
        user.full_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.email && user.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.phone_number && user.phone_number.includes(searchTerm)) || // Phone number doesn't need to be lowercase
      userRole.includes(lowerCaseSearchTerm)
    );
  });

  const getActionsForUser = (user) => {
    if (user.id === currentUser?.id) return [];

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

  const headerActions = (
    <>
      <Link
        to="/admin-dashboard"
        className="flex items-center font-semibold bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 shadow-sm text-sm"
      >
        <ChevronLeft size={16} className="mr-2" /> Back to Dashboard
      </Link>
      {role !== "OBSERVER" && (
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
            onClick={() => setActiveTab("active")}
          />
          <TabButton
            title="Inactive Members"
            isActive={activeTab === "inactive"}
            onClick={() => setActiveTab("inactive")}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            {/* --- MODIFICATION: PLACEHOLDER TEXT UPDATED --- */}
            <input
              type="text"
              placeholder="Search by name, username, email, role, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename={`users-${activeTab}-${
              new Date().toISOString().split("T")[0]
            }.csv`}
            className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 text-sm"
          >
            <FileDown size={16} className="mr-2" /> Download CSV
          </CSVLink>
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
                  Email
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Role
                </th>
                <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase">
                  Phone
                </th>
                {role !== "OBSERVER" && (
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
                    colSpan={role !== "OBSERVER" ? 6 : 5}
                    className="text-center py-10"
                  >
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
                    <td className="py-4 px-6 text-gray-600">
                      {user.email || "--"}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {roleDisplayMap[user.role] || user.role}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.phone_number || "--"}
                    </td>
                    {role !== "OBSERVER" && (
                      <td className="py-4 px-6 text-center">
                        {user.id !== currentUser?.id && (
                          <ActionMenu actions={getActionsForUser(user)} />
                        )}
                      </td>
                    )}
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
    </DashboardLayout>
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
